// Get DOM elements
const countryInput = document.getElementById('country-input');
const searchBtn = document.getElementById('search-btn');
const spinner = document.getElementById('loading-spinner');
const countryInfo = document.getElementById('country-info');
const borderingCountries = document.getElementById('bordering-countries');
const errorMessage = document.getElementById('error-message');

// Hide spinner on page load
spinner.classList.add('hidden');

// Helper functions
function showSpinner() {
    spinner.classList.remove('hidden');
}

function hideSpinner() {
    spinner.classList.add('hidden');
}

function clearResults() {
    countryInfo.innerHTML = '';
    borderingCountries.innerHTML = '';
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';
}

function displayError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

// Display main country info
function displayCountry(country) {
    countryInfo.innerHTML = `
        <h2>${country.name.common}</h2>
        <img src="${country.flags?.svg || 'https://via.placeholder.com/180?text=No+Flag'}" 
             alt="Flag of ${country.name.common}" 
             width="180" 
             style="margin: 15px 0; border-radius: 8px; border: 1px solid #ddd;">
        <p><strong>Capital:</strong> ${country.capital?.[0] || 'N/A'}</p>
        <p><strong>Population:</strong> ${country.population.toLocaleString()}</p>
        <p><strong>Region:</strong> ${country.region || 'N/A'}</p>
    `;
}

// Display bordering countries (batch fetch)
async function displayBorders(borderCodes) {
    if (!borderCodes || borderCodes.length === 0) {
        borderingCountries.innerHTML = '<h3>Bordering Countries</h3><p>No bordering countries (island nation).</p>';
        return;
    }

    borderingCountries.innerHTML = '<h3>Bordering Countries</h3>';

    try {
        const codes = borderCodes.join(',');
        const response = await fetch(`https://restcountries.com/v3.1/alpha?codes=${codes}`);
        if (!response.ok) {
            throw new Error('Failed to load bordering countries');
        }
        const data = await response.json();

        const gridContainer = document.createElement('div');
        gridContainer.style.display = 'grid';
        gridContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(120px, 1fr))';
        gridContainer.style.gap = '16px';
        gridContainer.style.marginTop = '15px';

        data.forEach(borderCountry => {
            const item = document.createElement('div');
            item.style.textAlign = 'center';
            item.style.background = '#ffffff';
            item.style.padding = '12px';
            item.style.borderRadius = '10px';
            item.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)';
            item.innerHTML = `
                <img src="${borderCountry.flags?.svg || 'https://via.placeholder.com/100?text=No+Flag'}" 
                     alt="Flag of ${borderCountry.name.common}" 
                     width="100" 
                     style="border-radius: 8px; margin-bottom: 8px;">
                <p style="margin: 0; font-size: 0.95rem; font-weight: 500;">${borderCountry.name.common}</p>
            `;
            gridContainer.appendChild(item);
        });

        borderingCountries.appendChild(gridContainer);

    } catch (err) {
        console.error('Border fetch error:', err);
        borderingCountries.innerHTML += '<p style="color: #e74c3c; margin-top: 10px;">Could not load bordering countries.</p>';
    }
}

// Main search function
async function searchCountry() {
    const countryName = countryInput.value.trim();

    // Always clear previous results first – even for empty input
    clearResults();

    if (!countryName) {
        displayError('Please enter a country name');
        return;
    }

    showSpinner();

    try {
        const response = await fetch(
            `https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fullText=true`
        );

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Country not found. Please check the spelling.');
            }
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data || data.length === 0) {
            throw new Error('No country found.');
        }

        const country = data[0];

        // Warn if multiple exact matches (rare with fullText=true)
        let extraInfo = '';
        if (data.length > 1) {
            extraInfo = `<p style="color: #e67e22; font-style: italic; margin-top: 12px;">
                Showing first result (${country.name.common}). 
                ${data.length - 1} other exact matches found — try being more specific.
            </p>`;
        }

        displayCountry(country);
        if (extraInfo) countryInfo.innerHTML += extraInfo;

        await displayBorders(country.borders);

    } catch (error) {
        console.error('Search error:', error);
        displayError(error.message || 'Something went wrong. Please try again.');
    } finally {
        hideSpinner();
    }
}

// Event listeners
searchBtn.addEventListener('click', searchCountry);

countryInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchCountry();
    }
});