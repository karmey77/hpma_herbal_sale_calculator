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
        label.textContent = `種植植物 Plant ${i + 1}`;

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
            select.innerHTML = '<option value="">請選擇植物</option>';

            const aquaticOptgroup = document.createElement('optgroup');
            aquaticOptgroup.label = '水生植物';
            const terrestrialOptgroup = document.createElement('optgroup');
            terrestrialOptgroup.label = '陸生植物';

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

            let plants = [];
            for (let i = 0; i < plantCount; i++) {
                const plantName = document.getElementById(`planPlant${i}`).value;
                if (plantName) {
                    const plantData = window.plantData[plantName];
                    plants.push({
                        name: plantName,
                        qualities: ['gold', 'purple', 'blue'].map(color => ({
                            color,
                            price: Math.floor((plantData.colors[color]?.gold_coins || 0) * priceIncrease)
                        })).filter(q => q.price > 0).sort((a, b) => b.price - a.price)
                    });
                }
            }

            // 按照最高品質價格對植物進行排序
            plants.sort((a, b) => b.qualities[0].price - a.qualities[0].price);

            const result = findBestPlantingPlan(totalBudget, plants);
            console.log('Calculation result:', result);

            displayPlanResult(result, totalBudget);
        } catch (error) {
            console.error('Calculation error:', error);
            alert('計算中出現錯誤，請確認數據或回報作者。 Error found, check the input again or contact the author.');
        } finally {
            hideLoading();
        }
    }, 100);
}

function findBestPlantingPlan(budget, plants) {
    let bestPlan = [];
    let maxRevenue = 0;
    let minQuantity = Infinity;

    function generatePlans(index, remainingBudget, currentPlan, currentQuantity) {
        if (index === plants.length || Date.now() - startTime > 9500) {
            const currentRevenue = currentPlan.reduce((sum, item) => sum + item.quantity * item.price, 0);
            if (currentRevenue > maxRevenue || (currentRevenue === maxRevenue && currentQuantity < minQuantity)) {
                maxRevenue = currentRevenue;
                minQuantity = currentQuantity;
                bestPlan = [...currentPlan];
            }
            return;
        }

        const plant = plants[index];
        for (const quality of plant.qualities) {
            const maxQuantity = Math.floor(remainingBudget / quality.price);
            for (let quantity = maxQuantity; quantity >= 0; quantity--) {
                const cost = quantity * quality.price;
                currentPlan.push({ name: plant.name, quality: quality.color, quantity, price: quality.price });
                generatePlans(index + 1, remainingBudget - cost, currentPlan, currentQuantity + quantity);
                currentPlan.pop();
                if (quantity === 0) break;
            }
        }
    }

    const startTime = Date.now();
    generatePlans(0, budget, [], 0);

    return {
        plan: bestPlan,
        total: maxRevenue
    };
}

function displayPlanResult(result, totalBudget) {
    const resultDiv = document.getElementById('planResult');
    let resultHTML = '<h2>最佳種植計劃：</h2><div class="result-container">';

    const qualityEmojis = {
        'gold': '💛',
        'purple': '💜',
        'blue': '💙'
    };

    let totalRevenue = 0;
    let plantNames = [...new Set(result.plan.map(item => item.name))];

    for (const plantName of plantNames) {
        const plantData = window.plantData[plantName];
        resultHTML += `
        <div class="result-item">
            <table class="result-table">
                <tr>
                    <th colspan="4" class="plant-name">${plantName}</th>
                </tr>
                <tr>
                    <th>品質</th>
                    <th>數量</th>
                    <th>單價</th>
                    <th>小計</th>
                </tr>`;

        let plantTotal = 0;
        for (const quality of ['gold', 'purple', 'blue']) {
            const item = result.plan.find(i => i.name === plantName && i.quality === quality);
            const quantity = item ? item.quantity : 0;
            const price = Math.floor((plantData.colors[quality]?.gold_coins || 0) * (sharedValues.priceIncrease / 100 + 1));
            const subtotal = quantity * price;
            plantTotal += subtotal;
            totalRevenue += subtotal;

            resultHTML += `
                <tr>
                    <td>${qualityEmojis[quality]}</td>
                    <td>${quantity}</td>
                    <td class="currency">${formatCurrency(price)}</td>
                    <td class="currency">${formatCurrency(subtotal)}</td>
                </tr>`;
        }

        resultHTML += `
                <tr class="plant-total">
                    <td colspan="3">總計</td>
                    <td class="currency">${formatCurrency(plantTotal)} 金幣</td>
                </tr>
            </table>
        </div>`;
    }

    resultHTML += `
        <div class="result-summary">
            <p>總收入：<span class="currency">${formatCurrency(totalRevenue)} 金幣</span></p>
            <p>剩餘金額：<span class="currency">${formatCurrency(totalBudget - totalRevenue)} 金幣</span></p>
            <p class="no-blame">本計算器無法及時反應版本變化，請謹慎使用！</p>
        </div>
    </div>`;

    resultDiv.innerHTML = resultHTML;
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('planCalculateButton').addEventListener('click', calculatePlan);
    updatePlanPlantSelections();
});