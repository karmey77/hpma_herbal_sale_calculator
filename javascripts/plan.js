// plan.js

function updatePlanPlantSelections() {
    if (!plantData) {
        console.error('Plant data not loaded yet');
        return;
    }
    const plantCount = parseInt(document.getElementById('planPlantCount').value);
    const planPlantSelectionsDiv = document.getElementById('planPlantSelections');
    planPlantSelectionsDiv.innerHTML = '';

    for (let i = 0; i < plantCount; i++) {
        const plantDiv = document.createElement('div');
        plantDiv.className = 'plant-selection';
        plantDiv.id = `planPlantSelection${i}`;

        const label = document.createElement('label');
        label.htmlFor = `planPlant${i}`;
        label.textContent = `收購植物 Plant ${i + 1}`;

        const select = document.createElement('select');
        select.id = `planPlant${i}`;
        select.name = `planPlant${i}`;

        select.addEventListener('change', updatePlanPlantOptions);

        plantDiv.appendChild(label);
        plantDiv.appendChild(select);

        planPlantSelectionsDiv.appendChild(plantDiv);
    }

    updatePlanPlantOptions();
}

function updatePlanPlantOptions() {
    const plantCount = parseInt(document.getElementById('planPlantCount').value);
    const selectedPlants = new Set();

    for (let i = 0; i < plantCount; i++) {
        const plantSelect = document.getElementById(`planPlant${i}`);
        if (plantSelect && plantSelect.value) {
            selectedPlants.add(plantSelect.value);
        }
    }

    for (let i = 0; i < plantCount; i++) {
        const select = document.getElementById(`planPlant${i}`);
        if (select) {
            const currentSelection = select.value;
            select.innerHTML = '<option value="">請選擇植物 Choose a plant</option>';

            const aquaticOptgroup = document.createElement('optgroup');
            aquaticOptgroup.label = '水生植物 Aquatic Plants';
            const terrestrialOptgroup = document.createElement('optgroup');
            terrestrialOptgroup.label = '陸生植物 Terrestrial Plants';

            for (const [plant, data] of Object.entries(plantData)) {
                if (!selectedPlants.has(plant) || plant === currentSelection) {
                    const option = document.createElement('option');
                    option.value = plant;
                    option.textContent = plant;
                    option.selected = (plant === currentSelection);
                    if (data.type === "水生") {
                        aquaticOptgroup.appendChild(option);
                    } else {
                        terrestrialOptgroup.appendChild(option);
                    }
                }
            }

            if (aquaticOptgroup.children.length > 0) {
                select.appendChild(aquaticOptgroup);
            }
            if (terrestrialOptgroup.children.length > 0) {
                select.appendChild(terrestrialOptgroup);
            }
        }
    }
}

function calculatePlan() {
    showLoading();
    setTimeout(() => {
        try {
            const plantCount = sharedValues.plantCount;
            const priceIncrease = sharedValues.priceIncrease / 100 + 1;
            const totalBudget = sharedValues.totalBudget;

            console.log('Budget:', totalBudget, 'Price increase:', priceIncrease);

            let plants = [];
            for (let i = 0; i < plantCount; i++) {
                const plantName = document.getElementById(`planPlant${i}`).value;
                if (plantName) {
                    const plantData = window.plantData[plantName];
                    plants.push({
                        name: plantName,
                        qualities: ['gold', 'purple', 'blue'].map(color => {
                            const basePrice = plantData.colors[color]?.gold_coins;
                            return {
                                color,
                                price: basePrice ? Math.floor(basePrice * priceIncrease) : 0
                            };
                        }).filter(q => q.price > 0)
                    });
                }
            }

            if (plants.length === 0) {
                throw new Error('請選擇至少一種植物。 Please select at least one plant.');
            }

            console.log('Plants:', plants);

            const result = findBestPlantingPlan(totalBudget, plants);
            console.log('Calculation result:', result);

            displayPlanResult(result, totalBudget);
        } catch (error) {
            console.error('Calculation error:', error);
            alert('計算中出現錯誤：' + error.message);
        } finally {
            hideLoading();
        }
    }, 100);
}

function findBestPlantingPlan(budget, plants) {
    // Flatten the plant qualities into a single array and create a lookup map
    const allQualities = [];
    const qualityMap = new Map();
    plants.forEach(plant => {
        plant.qualities.forEach(quality => {
            const qualityKey = `${plant.name}-${quality.color}`;
            allQualities.push({
                ...quality,
                name: plant.name,
                key: qualityKey
            });
            qualityMap.set(qualityKey, quality.price);
        });
    });

    // Sort qualities by price in descending order, with gold always first
    allQualities.sort((a, b) => {
        if (a.color === 'gold' && b.color !== 'gold') return -1;
        if (a.color !== 'gold' && b.color === 'gold') return 1;
        return b.price - a.price;
    });

    // Initialize the dynamic programming table
    const dp = new Array(allQualities.length + 1).fill(null).map(() => 
        new Array(budget + 1).fill(0)
    );
    const choices = new Array(allQualities.length + 1).fill(null).map(() => 
        new Array(budget + 1).fill(null)
    );

    // Helper function to check if gold quantity is highest
    function isGoldHighest(currentChoices, newQuality, newQuantity) {
        const goldQuantity = (currentChoices[`${newQuality.name}-gold`] || 0) + 
                             (newQuality.color === 'gold' ? newQuantity : 0);
        const otherQuantities = Object.entries(currentChoices)
            .filter(([key]) => !key.endsWith('-gold'))
            .map(([key, value]) => value);
        if (newQuality.color !== 'gold') {
            otherQuantities.push(newQuantity);
        }
        return goldQuantity >= Math.max(...otherQuantities, 0);
    }

    // Fill the dynamic programming table
    for (let i = 1; i <= allQualities.length; i++) {
        const quality = allQualities[i - 1];
        for (let j = 0; j <= budget; j++) {
            dp[i][j] = dp[i - 1][j];
            choices[i][j] = choices[i - 1][j] ? { ...choices[i - 1][j] } : {};

            for (let quantity = 1; quantity <= Math.min(30, Math.floor(j / quality.price)); quantity++) {
                const newValue = dp[i - 1][j - quantity * quality.price] + quantity * quality.price;
                const newChoices = { ...choices[i - 1][j - quantity * quality.price] };
                newChoices[quality.key] = (newChoices[quality.key] || 0) + quantity;

                if (newValue > dp[i][j] && isGoldHighest(newChoices, quality, quantity)) {
                    dp[i][j] = newValue;
                    choices[i][j] = newChoices;
                }
            }
        }
    }

    // Reconstruct the optimal plan
    const optimalChoices = choices[allQualities.length][budget];
    const total = dp[allQualities.length][budget];
    const remainingBudget = budget - total;

    // Convert the plan to the expected format
    const plan = {};
    for (const [key, quantity] of Object.entries(optimalChoices)) {
        const [name, color] = key.split('-');
        if (!plan[name]) plan[name] = [];
        plan[name].push({
            color,
            quantity,
            price: qualityMap.get(key)
        });
    }

    const formattedPlan = Object.entries(plan).map(([name, qualities]) => ({
        name,
        qualities: qualities.sort((a, b) => b.quantity - a.quantity) // Sort qualities by quantity
    }));

    return {
        plan: formattedPlan,
        total: total,
        remainingBudget: remainingBudget
    };
}

function displayPlanResult(result, totalBudget) {
    const resultDiv = document.getElementById('planResult');
    let resultHTML = `
        <h2 class="result-title">最佳販售計劃 / Best Selling Plan:</h2>
        <div class="plan-note">
            <p>⚠️ 注意：每種植物的每個品質最多限制 30 株。</p>
            <p>Note: Each plant can have a maximum of 30 of each quality.</p>
        </div>
        <div class="result-container">`;

    const qualityEmojis = {
        'gold': '💛',
        'purple': '💜',
        'blue': '💙'
    };

    const qualityOrder = ['gold', 'purple', 'blue'];
    let totalRevenue = 0;

    if (result.plan.length === 0) {
        resultHTML += '<p class="no-result">無法找到合適的種植方案。請檢查預算和植物選擇。</p>';
        resultHTML += '<p class="no-result">No suitable plan found. Please check your budget and plant selection.</p>';
    } else {
        for (const item of result.plan) {
            resultHTML += `
            <div class="result-item">
                <h3 class="plant-name">${item.name}</h3>
                <table class="result-table">
                    <tr>
                        <th>品質<br>Quality</th>
                        <th>數量<br>Quantity</th>
                        <th>單價<br>Unit Price</th>
                        <th>小計<br>Subtotal</th>
                    </tr>`;

            let plantTotal = 0;
            for (const color of qualityOrder) {
                const quality = item.qualities.find(q => q.color === color);
                if (quality) {
                    const subtotal = quality.quantity * quality.price;
                    plantTotal += subtotal;
                    resultHTML += `
                    <tr>
                        <td>${qualityEmojis[color]}</td>
                        <td>${quality.quantity}</td>
                        <td class="currency">${formatCurrency(quality.price)}</td>
                        <td class="currency">${formatCurrency(subtotal)}</td>
                    </tr>`;
                }
            }

            resultHTML += `
                    <tr class="plant-total">
                        <td colspan="3">總計 / Total</td>
                        <td class="currency">${formatCurrency(plantTotal)}</td>
                    </tr>
                </table>
            </div>`;
            totalRevenue += plantTotal;
        }
    }

    resultHTML += `
        </div>
        <div class="result-summary">
            <p>總收入 / Total Revenue: <span class="currency">${formatCurrency(totalRevenue)}</span></p>
            <p>剩餘金額 / Remaining Budget: <span class="currency">${formatCurrency(totalBudget - totalRevenue)}</span></p>
        </div>
        <div class="no-blame" style="margin-top: 20px;">
            <p>計算時考慮所有植物和品質的組合，並限制每種植物每個品質最多 30 株。</p>
            <p>The calculation considers all plant and quality combinations, with a limit of 30 for each quality per plant.</p>
            <p>若想自定義限制，請使用<a href="#">用庫存計算</a>。</p>
            <p>For custom restrictions, please use <a href="#">Calculate with Inventory</a>.</p>
        </div>`;

    resultDiv.innerHTML = resultHTML;
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('planCalculateButton').addEventListener('click', calculatePlan);
    updatePlanPlantSelections();
});