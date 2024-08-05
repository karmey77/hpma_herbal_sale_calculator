let plantData;
let sharedValues = {
    plantCount: 3,
    priceIncrease: 300,
    totalBudget: 5000
};
let maxRetries = 5;
let retryCount = 0;

document.addEventListener('DOMContentLoaded', function () {
    loadPlantData();
    document.getElementById('plantCount').addEventListener('change', function (e) {
        sharedValues.plantCount = parseInt(e.target.value);
        updatePlantSelections();
    });
    document.getElementById('planPlantCount').addEventListener('change', function (e) {
        sharedValues.plantCount = parseInt(e.target.value);
        updatePlanPlantSelections();
    });
    document.getElementById('priceIncrease').addEventListener('change', function (e) {
        sharedValues.priceIncrease = parseInt(e.target.value);
    });
    document.getElementById('planPriceIncrease').addEventListener('change', function (e) {
        sharedValues.priceIncrease = parseInt(e.target.value);
    });
    document.getElementById('totalBudget').addEventListener('change', function (e) {
        sharedValues.totalBudget = parseInt(e.target.value);
    });
    document.getElementById('planTotalBudget').addEventListener('change', function (e) {
        sharedValues.totalBudget = parseInt(e.target.value);
    });
    document.getElementById('calculatorTabs').addEventListener('shown.bs.tab', function (e) {
        clearInactiveResults();
        const currentTab = e.target.id.split('-')[0];
        if (currentTab === 'sell') {
            document.getElementById('plantCount').value = sharedValues.plantCount;
            document.getElementById('priceIncrease').value = sharedValues.priceIncrease;
            document.getElementById('totalBudget').value = sharedValues.totalBudget;
            updatePlantSelections();
        } else if (currentTab === 'plan') {
            document.getElementById('planPlantCount').value = sharedValues.plantCount;
            document.getElementById('planPriceIncrease').value = sharedValues.priceIncrease;
            document.getElementById('planTotalBudget').value = sharedValues.totalBudget;
            updatePlanPlantSelections();
        }
    });
    updatePlantSelections();
    updatePlanPlantSelections();
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
            window.plantData = plantData; // Make plantData globally accessible
            initializePage();
        } catch (error) {
            console.error('Error parsing plant data:', error);
        }
    } else {
        console.error('Plant data script not found');
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

    updatePlantSelections();
    updatePlanPlantSelections();

    setTimeout(() => {
        const plantSelects = document.querySelectorAll('#plantSelections select, #planPlantSelections select');
        plantSelects.forEach(select => {
            select.style.display = 'none';
            setTimeout(() => {
                select.style.display = '';
            }, 0);
        });
    }, 100);
}

function formatCurrency(amount) {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function clearInactiveResults() {
    const activeTab = document.querySelector('.tab-pane.active');
    if (activeTab.id === 'sell') {
        document.getElementById('planResult').innerHTML = '';
    } else if (activeTab.id === 'plan') {
        document.getElementById('result').innerHTML = '';
    }
}