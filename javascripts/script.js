let plantData;
let maxRetries = 5;
let retryCount = 0;

// 將 loadPlantData 移動到 DOMContentLoaded 事件中
document.addEventListener('DOMContentLoaded', function () {
    loadPlantData();
    document.getElementById('plantCount').addEventListener('change', updatePlantSelections);
    updatePlantSelections(); // 添加這行
});

function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function loadPlantData() {
    const plantDataScript = document.getElementById('plantData');
    if (plantDataScript) {
        try {
            plantData = JSON.parse(plantDataScript.textContent);
            console.log('Plant data loaded:', Object.keys(plantData));
            initializePage();
        } catch (error) {
            console.error('Error parsing plant data:', error);
            retryLoadPlantData();
        }
    } else {
        console.error('Plant data script not found');
        retryLoadPlantData();
    }
}

function retryLoadPlantData() {
    if (retryCount < maxRetries) {
        retryCount++;
        console.log(`Retrying to load plant data (${retryCount}/${maxRetries})...`);
        setTimeout(loadPlantData, 1000);
    } else {
        console.error('Failed to load plant data after multiple attempts');
    }
}

function initializePage() {
    if (!plantData) {
        console.error('Plant data not loaded yet');
        return;
    }

    document.getElementById('plantCount').addEventListener('change', updatePlantSelections);
    document.getElementById('calculateButton').addEventListener('click', calculate);
    updatePlantSelections();
    initializePlantSelections();

    // 添加一个小延迟来确保分类标签正确显示
    setTimeout(() => {
        const plantSelects = document.querySelectorAll('#plantSelections select');
        plantSelects.forEach(select => {
            select.style.display = 'none';
            setTimeout(() => {
                select.style.display = '';
            }, 0);
        });
    }, 100);
}

// 添加這個新函數
function initializePlantSelections() {
    const plantCount = parseInt(document.getElementById('plantCount').value);
    for (let i = 0; i < plantCount; i++) {
        const select = document.getElementById(`plant${i}`);
        if (select) {
            select.addEventListener('change', function () {
                updatePlantOptions();
                updatePlantQuantities(i);
            });
        }
    }
}

// function fillRandomData() {
//     // 隨機選擇植物數量
//     const plantCount = Math.floor(Math.random() * 3) + 1;
//     document.getElementById('plantCount').value = plantCount;
//     updatePlantSelections();

//     // 隨機選擇加價幅度
//     const priceIncreaseOptions = [100, 200, 300];
//     const priceIncrease = priceIncreaseOptions[Math.floor(Math.random() * priceIncreaseOptions.length)];
//     document.getElementById('priceIncrease').value = priceIncrease;

//     // 隨機設置預算
//     // const budget = Math.floor(Math.random() * 50000) + 5000;
//     // document.getElementById('totalBudget').value = budget;

//     // 為每個植物隨機填充數據
//     for (let i = 0; i < plantCount; i++) {
//         const plantSelect = document.getElementById(`plant${i}`);
//         const plantOptions = Array.from(plantSelect.options).slice(1);
//         const randomPlant = plantOptions[Math.floor(Math.random() * plantOptions.length)];
//         plantSelect.value = randomPlant.value;
//         plantSelect.dispatchEvent(new Event('change'));

//         for (const color of ['gold', 'purple', 'blue', 'white', 'special']) {
//             const input = document.getElementById(`${color}${i}`);
//             if (input) {
//                 input.value = Math.floor(Math.random() * 50);
//             }
//         }
//     }
// }

// Call loadPlantData when the script loads
loadPlantData();

// Update plant selections based on the chosen number of plants
function updatePlantSelections() {
    if (!plantData) {
        console.error('Plant data not loaded yet');
        return;
    }
    const plantCount = parseInt(document.getElementById('plantCount').value);
    const plantSelectionsDiv = document.getElementById('plantSelections');
    plantSelectionsDiv.innerHTML = '';

    for (let i = 0; i < plantCount; i++) {
        const plantDiv = document.createElement('div');
        plantDiv.className = 'plant-selection';
        plantDiv.id = `plantSelection${i}`;

        const label = document.createElement('label');
        label.htmlFor = `plant${i}`;
        label.textContent = `高價收購植物 Plant ${i + 1}`;

        const select = document.createElement('select');
        select.id = `plant${i}`;
        select.name = `plant${i}`;

        // 添加事件監聽器
        select.addEventListener('change', function () {
            updatePlantOptions();
            updatePlantQuantities(i);
        });

        plantDiv.appendChild(label);
        plantDiv.appendChild(select);

        // 添加數量輸入區域
        const quantitiesDiv = document.createElement('div');
        quantitiesDiv.id = `quantities${i}`;
        plantDiv.appendChild(quantitiesDiv);

        plantSelectionsDiv.appendChild(plantDiv);
    }

    updatePlantOptions();
}

function updatePlantOptions() {
    const plantCount = parseInt(document.getElementById('plantCount').value);
    const selectedPlants = new Set();

    for (let i = 0; i < plantCount; i++) {
        const plantSelect = document.getElementById(`plant${i}`);
        if (plantSelect && plantSelect.value) {
            selectedPlants.add(plantSelect.value);
        }
    }

    for (let i = 0; i < plantCount; i++) {
        const select = document.getElementById(`plant${i}`);
        if (select) {
            const currentSelection = select.value;

            select.innerHTML = '<option value="">請選擇植物</option>';

            // 添加水生植物组
            const aquaticOptgroup = document.createElement('optgroup');
            aquaticOptgroup.label = '水生植物';
            for (const [plant, data] of Object.entries(plantData).filter(([_, data]) => data.type === "水生")) {
                if (!selectedPlants.has(plant) || plant === currentSelection) {
                    const option = document.createElement('option');
                    option.value = plant;
                    option.textContent = plant;
                    option.selected = (plant === currentSelection);
                    aquaticOptgroup.appendChild(option);
                }
            }
            if (aquaticOptgroup.children.length > 0) {
                select.appendChild(aquaticOptgroup);
            }

            // 添加陆生植物组
            const terrestrialOptgroup = document.createElement('optgroup');
            terrestrialOptgroup.label = '陸生植物';
            for (const [plant, data] of Object.entries(plantData).filter(([_, data]) => data.type === "陸生")) {
                if (!selectedPlants.has(plant) || plant === currentSelection) {
                    const option = document.createElement('option');
                    option.value = plant;
                    option.textContent = plant;
                    option.selected = (plant === currentSelection);
                    terrestrialOptgroup.appendChild(option);
                }
            }
            if (terrestrialOptgroup.children.length > 0) {
                select.appendChild(terrestrialOptgroup);
            }
        }
    }
}

// Update quantity inputs for a selected plant
function updatePlantQuantities(index) {
    const plantSelect = document.getElementById(`plant${index}`);
    const quantitiesDiv = document.getElementById(`quantities${index}`);
    const selectedPlant = plantSelect.value;

    if (selectedPlant) {
        const isAquatic = plantData[selectedPlant].type === "水生";
        const hasSpecialColors = plantData[selectedPlant].special_colors.length > 0;

        let html = '<table class="quality-table"><tr><th>品質</th><th>數量</th>';
        if (isAquatic && hasSpecialColors) {
            html += '<th>特殊顏色數量</th>';
        }
        html += '</tr>';

        const qualities = [
            { emoji: '💛', name: 'gold', label: '金' },
            { emoji: '💜', name: 'purple', label: '紫' },
            { emoji: '💙', name: 'blue', label: '藍' }
        ];
        for (const quality of qualities) {
            if (plantData[selectedPlant].colors[quality.name] && plantData[selectedPlant].colors[quality.name].gold_coins) {
                html += `<tr>
                    <td>${quality.emoji} ${quality.label}</td>
                    <td><input type="number" id="${quality.name}${index}" value="0" min="0"></td>`;
                if (isAquatic && hasSpecialColors) {
                    html += `<td><input type="number" id="${quality.name}Special${index}" value="0" min="0"></td>`;
                }
                html += '</tr>';
            }
        }

        html += '</table>';
        quantitiesDiv.innerHTML = html;
    } else {
        quantitiesDiv.innerHTML = '';
    }
}

function calculate() {
    showLoading();
    setTimeout(() => {
        try {
            const plantCount = parseInt(document.getElementById('plantCount').value);
            const priceIncrease = parseInt(document.getElementById('priceIncrease').value) / 100 + 1;
            const totalBudget = parseInt(document.getElementById('totalBudget').value);

            let plants = [];
            for (let i = 0; i < plantCount; i++) {
                const plantName = document.getElementById(`plant${i}`).value;
                if (plantName) {
                    const plant = {
                        name: plantName,
                        qualities: []
                    };

                    const isAquatic = plantData[plantName].type === "水生";
                    const hasSpecialColors = plantData[plantName].special_colors.length > 0;

                    for (const color of ['gold', 'purple', 'blue']) {
                        const quantity = parseInt(document.getElementById(`${color}${i}`).value) || 0;
                        const basePrice = plantData[plantName].colors[color].gold_coins || 0;
                        if (basePrice > 0) {
                            const price = Math.floor(basePrice * priceIncrease);
                            plant.qualities.push({ color, quantity, price });

                            if (isAquatic && hasSpecialColors) {
                                const specialQuantity = parseInt(document.getElementById(`${color}Special${i}`).value) || 0;
                                const baseSpecialPrice = basePrice * 1.1; // 10% bonus for special colors
                                const specialPrice = Math.ceil(baseSpecialPrice * priceIncrease);
                                plant.qualities.push({ color: `${color}Special`, quantity: specialQuantity, price: specialPrice });
                            }
                        }
                    }

                    plants.push(plant);
                }
            }

            console.log('Plants data:', plants);
            console.log('Total budget:', totalBudget);

            const result = findBestCombination(totalBudget, plants);
            console.log('Calculation result:', result);

            displayResult(result, totalBudget);
        } catch (error) {
            console.error('Calculation error:', error);
            alert('計算中出現錯誤，請確認數據或回報作者。 Error found, check the input again or contact the author.');
        } finally {
            hideLoading();
        }
    }, 100);
}

function findBestCombination(budget, plants) {
    let bestCombination = [];
    let maxRevenue = 0;
    const minPrice = Math.min(...plants.flatMap(p => p.qualities.map(q => q.price)));

    function* combinationGenerator() {
        const stack = [{
            index: 0,
            budget: budget,
            combination: [],
            revenue: 0
        }];

        while (stack.length > 0) {
            const current = stack.pop();

            if (current.revenue > maxRevenue) {
                maxRevenue = current.revenue;
                bestCombination = [...current.combination];

                if (current.budget === 0) {
                    return;
                }
            }

            if (current.budget < Math.min(minPrice, 6)) {
                continue;
            }

            if (current.index >= plants.length) {
                continue;
            }

            const plant = plants[current.index];
            const plantCombinations = generatePlantCombinations(plant, current.budget);

            for (const plantCombo of plantCombinations) {
                const cost = plantCombo.reduce((sum, item) => sum + item.quantity * item.price, 0);
                if (cost <= current.budget) {
                    stack.push({
                        index: current.index + 1,
                        budget: current.budget - cost,
                        combination: [
                            ...current.combination,
                            { name: plant.name, qualities: plantCombo }
                        ],
                        revenue: current.revenue + cost
                    });
                }
            }

            // 不選擇當前植物
            stack.push({
                index: current.index + 1,
                budget: current.budget,
                combination: current.combination,
                revenue: current.revenue
            });

            yield;
        }
    }

    const generator = combinationGenerator();
    const startTime = Date.now();

    while (Date.now() - startTime < 9500) {
        const result = generator.next();
        if (result.done) break;
    }

    const totalRevenue = bestCombination.reduce((sum, plant) =>
        sum + plant.qualities.reduce((plantSum, quality) =>
            plantSum + quality.quantity * quality.price, 0), 0);

    console.log('Best combination found:', bestCombination);
    console.log('Total revenue:', totalRevenue);
    console.log('Remaining budget:', budget - totalRevenue);

    return {
        combination: bestCombination,
        total: totalRevenue
    };
}

function generatePlantCombinations(plant, budget) {
    let combinations = [[]];

    for (const quality of plant.qualities) {
        const newCombinations = [];
        for (const combo of combinations) {
            for (let quantity = 0; quantity <= quality.quantity; quantity++) {
                const newCombo = [...combo, { color: quality.color, quantity, price: quality.price }];
                const cost = newCombo.reduce((sum, item) => sum + item.quantity * item.price, 0);
                if (cost <= budget) {
                    newCombinations.push(newCombo);
                }
            }
        }
        combinations = newCombinations;
    }

    return combinations.filter(combo => combo.some(item => item.quantity > 0));
}

function displayResult(result, totalBudget) {
    const resultDiv = document.getElementById('result');
    let resultHTML = '<h2>最佳組合：</h2><div class="result-container">';

    const qualityEmojis = {
        'gold': '💛',
        'purple': '💜',
        'blue': '💙'
    };

    let totalRevenue = 0;

    // 添加用于格式化金额的函数
    function formatCurrency(amount) {
        return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    for (const item of result.combination) {
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
                </tr>`;

        let plantTotal = 0;
        for (const quality of item.qualities) {
            if (quality.quantity > 0) {
                const subtotal = quality.quantity * quality.price;
                plantTotal += subtotal;
                const emoji = qualityEmojis[quality.color.replace('Special', '')] || '';
                const isSpecial = quality.color.includes('Special');
                resultHTML += `
                <tr>
                    <td>${emoji} ${isSpecial ? '特殊色' : ''}</td>
                    <td>${quality.quantity}</td>
                    <td class="currency">${formatCurrency(quality.price)}</td>
                    <td class="currency">${formatCurrency(subtotal)}</td>
                </tr>`;
            }
        }
        resultHTML += `
                <tr class="plant-total">
                    <td colspan="3">總計</td>
                    <td class="currency">${formatCurrency(plantTotal)} 金幣</td>
                </tr>
            </table>
        </div>`;
        totalRevenue += plantTotal;
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