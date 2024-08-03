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
                        qualities: Object.entries(plantData.colors)
                            .filter(([_, data]) => data.gold_coins)
                            .map(([color, data]) => ({
                                color,
                                price: Math.floor(data.gold_coins * priceIncrease)
                            }))
                            .sort((a, b) => b.price - a.price) // Sort by price descending
                    });
                }
            }

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

    function generatePlans(index, remainingBudget, currentPlan, currentRevenue) {
        if (index === plants.length || Date.now() - startTime > 9500) {
            if (currentRevenue > maxRevenue) {
                maxRevenue = currentRevenue;
                bestPlan = [...currentPlan];
            }
            return;
        }

        const plant = plants[index];
        // 優先考慮金色品質
        for (const quality of plant.qualities) {
            if (quality.color === 'gold') {
                const maxQuantity = Math.floor(remainingBudget / quality.price);
                for (let quantity = maxQuantity; quantity >= 0; quantity--) {
                    const cost = quantity * quality.price;
                    currentPlan.push({ name: plant.name, quality: quality.color, quantity, price: quality.price });
                    generatePlans(index + 1, remainingBudget - cost, currentPlan, currentRevenue + cost);
                    currentPlan.pop();
                    if (quantity % 10 === 0) break; // 每10次迭代檢查一次時間
                }
                break; // 處理完金色後，不再處理其他顏色
            }
        }

        // 如果沒有金色或金色處理完後還有預算，再處理其他顏色
        if (remainingBudget > 0) {
            for (const quality of plant.qualities) {
                if (quality.color !== 'gold') {
                    const maxQuantity = Math.floor(remainingBudget / quality.price);
                    for (let quantity = maxQuantity; quantity >= 0; quantity--) {
                        const cost = quantity * quality.price;
                        currentPlan.push({ name: plant.name, quality: quality.color, quantity, price: quality.price });
                        generatePlans(index + 1, remainingBudget - cost, currentPlan, currentRevenue + cost);
                        currentPlan.pop();
                        if (quantity % 10 === 0) break; // 每10次迭代檢查一次時間
                    }
                }
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
        'blue': '💙',
        'white': '🤍'
    };

    let totalRevenue = 0;

    for (const item of result.plan) {
        if (item.quantity > 0) {
            const subtotal = item.quantity * item.price;
            totalRevenue += subtotal;
            resultHTML += `
            <div class="result-item">
                <table class="result-table">
                    <tr>
                        <th colspan="4" class="plant-name">${item.name}</th>
                    </tr>
                    <tr>
                        <th>品質</th>
                        <th>數量</th>
                        <th>單價</th>
                        <th>小計</th>
                    </tr>
                    <tr>
                        <td>${qualityEmojis[item.quality] || ''}</td>
                        <td>${item.quantity}</td>
                        <td class="currency">${formatCurrency(item.price)}</td>
                        <td class="currency">${formatCurrency(subtotal)}</td>
                    </tr>
                </table>
            </div>`;
        }
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

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('planCalculateButton').addEventListener('click', calculatePlan);
    updatePlanPlantSelections();
});