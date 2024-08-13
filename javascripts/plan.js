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
                throw new Error('請選擇至少一種植物');
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
    // 將植物品質分為金色和非金色
    const goldQualities = [];
    const otherQualities = [];
    plants.forEach(plant => {
        plant.qualities.forEach(quality => {
            if (quality.color === 'gold') {
                goldQualities.push({ ...quality, name: plant.name });
            } else {
                otherQualities.push({ ...quality, name: plant.name });
            }
        });
    });

    // 按價格降序排列金色品質
    goldQualities.sort((a, b) => b.price - a.price);

    // 合併品質列表，金色品質優先
    const allQualities = [...goldQualities, ...otherQualities];

    let remainingBudget = budget;
    const plan = {};
    const plantQuantities = {};

    // 優先分配金色品質
    for (const quality of goldQualities) {
        const key = `${quality.name}-${quality.color}`;
        const maxQuantity = Math.min(30, Math.floor(remainingBudget / quality.price));
        if (maxQuantity > 0) {
            if (!plan[quality.name]) plan[quality.name] = [];
            plan[quality.name].push({ ...quality, quantity: maxQuantity });
            remainingBudget -= maxQuantity * quality.price;
            plantQuantities[key] = maxQuantity;
        }
        if (remainingBudget <= 0) break;
    }

    // 如果還有剩餘預算，分配其他品質
    if (remainingBudget > 0) {
        for (const quality of otherQualities) {
            const key = `${quality.name}-${quality.color}`;
            const currentQuantity = plantQuantities[key] || 0;
            const maxQuantity = Math.min(30 - currentQuantity, Math.floor(remainingBudget / quality.price));
            if (maxQuantity > 0) {
                if (!plan[quality.name]) plan[quality.name] = [];
                plan[quality.name].push({ ...quality, quantity: maxQuantity });
                remainingBudget -= maxQuantity * quality.price;
                plantQuantities[key] = (plantQuantities[key] || 0) + maxQuantity;
            }
            if (remainingBudget <= 0) break;
        }
    }

    return {
        plan: plan,
        total: budget - remainingBudget,
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

    if (Object.keys(result.plan).length === 0) {
        resultHTML += '<p class="no-result">無法找到合適的種植方案。請檢查預算和植物選擇。</p>';
        resultHTML += '<p class="no-result">No suitable plan found. Please check your budget and plant selection.</p>';
    } else {
        for (const [plantName, qualities] of Object.entries(result.plan)) {
            resultHTML += `
            <div class="result-item">
                <h3 class="plant-name">${plantName}</h3>
                <table class="result-table">
                    <tr>
                        <th>品質<br>Quality</th>
                        <th>數量<br>Quantity</th>
                        <th>單價<br>Unit Price</th>
                        <th>小計<br>Subtotal</th>
                    </tr>`;

            let plantTotal = 0;
            for (const color of qualityOrder) {
                const quality = qualities.find(q => q.color === color) || { color, quantity: 0, price: plantData[plantName].colors[color].gold_coins };
                const subtotal = quality.quantity * quality.price;
                plantTotal += subtotal;
                totalRevenue += subtotal;

                resultHTML += `
                    <tr>
                        <td>${qualityEmojis[color]}</td>
                        <td>${quality.quantity}</td>
                        <td class="currency">${formatCurrency(quality.price)}</td>
                        <td class="currency">${formatCurrency(subtotal)}</td>
                    </tr>`;
            }

            resultHTML += `
                    <tr class="plant-total">
                        <td colspan="3">總計 / Total</td>
                        <td class="currency">${formatCurrency(plantTotal)}</td>
                    </tr>
                </table>
            </div>`;
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