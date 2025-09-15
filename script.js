document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const INTRO_DURATION_MS = 8000; // Total intro time before fading out
    const LINE_DRAW_DURATION_MS = 6000; // Duration of the line drawing animation

    // --- DOM ELEMENTS ---
    const introScreen = document.getElementById('intro-screen');
    const graphSvg = document.getElementById('graph-svg');
    const mainContent = document.getElementById('main-content');

    /**
     * Generates a series of points for the graph line that trend upwards.
     * @param {number} width - The width of the graph area.
     * @param {number} height - The height of the graph area.
     * @param {number} pointCount - The number of points to generate.
     * @returns {Array<Object>} An array of {x, y} points.
     */
    function generateGraphPoints(width, height, pointCount) {
        const points = [];
        const xStep = width / (pointCount - 1);
        let currentY = height * 0.8; // Start 80% of the way down

        for (let i = 0; i < pointCount; i++) {
            points.push({ x: i * xStep, y: currentY });

            // Calculate next Y: move generally up (decrease Y) with some random jitter.
            // The -0.4 biases the random factor to be negative more often, pushing the line up.
            const randomFactor = (Math.random() - 0.48) * (height / 8); // Increased volatility
            const nextY = currentY - (height / pointCount) * 0.6 + randomFactor;
            
            // Clamp Y to stay within the top 10% and bottom 90% of the SVG height
            currentY = Math.max(height * 0.1, Math.min(height * 0.9, nextY));
        }
        return points;
    }

    /**
     * Easing function for smooth animation (cubic ease-out).
     * @param {number} t - Progress from 0 to 1.
     * @returns {number} Eased progress.
     */
    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

    /**
     * Fades out the intro and shows the main content.
     */
    function endIntro() {
        // Prevent this from running multiple times
        if (introScreen.classList.contains('intro-fading-out')) {
            return;
        }

        // Start the fade-out transition
        introScreen.classList.add('intro-fading-out');

        // Make the main content visible but still transparent
        mainContent.classList.remove('hidden');

        // Force a browser reflow. This ensures the browser acknowledges the
        // element's "opacity: 0" state before the transition is triggered.
        void mainContent.offsetWidth;

        // Now, add the class that triggers the fade-in transition
        mainContent.classList.add('main-content-visible');

        // Fetch portfolio data now that the main content is being shown.
        // This will happen while the content is fading in.
        fetchPortfolioHoldings();

    }

    /**
     * Initializes and starts the intro animation.
     */
    function startIntro() {
        const { width, height } = graphSvg.viewBox.baseVal;
        const points = generateGraphPoints(width, height, 50); // More points for a longer line
        const pointsString = points.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
        const lastPoint = points[points.length - 1];

        // Create the line element using the SVG namespace
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        line.setAttribute('class', 'graph-line');
        line.setAttribute('points', pointsString);

        // Create the endpoint circle
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('class', 'graph-end-dot');
        dot.setAttribute('cx', lastPoint.x);
        dot.setAttribute('cy', lastPoint.y);
        dot.setAttribute('r', 6);
        dot.setAttribute('vector-effect', 'non-scaling-stroke');

        // Add the new elements to the SVG
        graphSvg.appendChild(line);
        graphSvg.appendChild(dot);

        // Set up the "line drawing" animation by calculating its true length
        const lineLength = line.getTotalLength();
        line.style.strokeDasharray = lineLength;
        line.style.strokeDashoffset = lineLength;

        // Set a timer to end the intro
        setTimeout(endIntro, INTRO_DURATION_MS);

        // --- Camera Animation Logic ---
        const animationStartTime = performance.now();
        const viewBoxWidth = width;
        // We want the drawing head to appear at this position (e.g., 75% across the screen)
        const cameraTargetX = viewBoxWidth * 0.75;

        function animateCamera(currentTime) {
            const elapsedTime = currentTime - animationStartTime;
            const progress = Math.min(elapsedTime / LINE_DRAW_DURATION_MS, 1);
            const easedProgress = easeOutCubic(progress);

            // Calculate the current x-position of the drawing head in the SVG's coordinate system
            const headX = easedProgress * viewBoxWidth;

            // Calculate the new min-x for the viewBox to keep the head at our target position
            const newMinX = Math.max(0, headX - cameraTargetX);

            // Update the viewBox attribute to pan the camera
            graphSvg.setAttribute('viewBox', `${newMinX} 0 ${viewBoxWidth} ${height}`);

            // Continue the animation until the duration is reached
            if (progress < 1) {
                requestAnimationFrame(animateCamera);
            }
        }

        // Start the camera animation loop
        requestAnimationFrame(animateCamera);
    }

    startIntro();

    // --- Portfolio Holdings Logic ---
    async function fetchPortfolioHoldings() {
        const apiUrl = 'https://api.dozencrust.com/api/portfolio';
        const tableBody = document.querySelector('#holdings tbody');

        if (!tableBody) {
            console.error('Holdings table body not found!');
            return;
        }

        // Show a loading message while we fetch data
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Loading holdings...</td></tr>';

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            const portfolioData = await response.json();
            const holdings = portfolioData.positions; // The API response is an object with a 'positions' array

            // Clear the loading message
            tableBody.innerHTML = '';

            if (holdings && holdings.length > 0) {
                // The API returns an array of objects like:
                // { symbol: '...', quantity: '5', current_price: '53.08', market_value: '265.4' }
                holdings.forEach(holding => {
                    const row = tableBody.insertRow();

                    row.insertCell().textContent = holding.symbol;
                    row.insertCell().textContent = holding.quantity; // Use 'quantity' from the API response

                    // Format price and market value as US currency, handling potential null values
                    const lastPriceCell = row.insertCell();
                    if (holding.current_price !== null && holding.current_price !== undefined) {
                        lastPriceCell.textContent = parseFloat(holding.current_price).toLocaleString('en-US', {
                            style: 'currency',
                            currency: 'USD'
                        });
                    } else {
                        lastPriceCell.textContent = 'N/A';
                    }

                    const marketValueCell = row.insertCell();
                    if (holding.market_value !== null && holding.market_value !== undefined) {
                        marketValueCell.textContent = parseFloat(holding.market_value).toLocaleString('en-US', {
                            style: 'currency',
                            currency: 'USD'
                        });
                    } else {
                        marketValueCell.textContent = 'N/A';
                    }
                });
            } else {
                tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No holdings to display.</td></tr>';
            }
        } catch (error) {
            console.error('Failed to fetch portfolio holdings:', error);
            let errorMessage = 'Error loading portfolio data.';
            // Your GitHub Pages site is on HTTPS, but the API is on HTTP.
            // Browsers block these "mixed content" requests for security.
            if (window.location.protocol === 'https:' && apiUrl.startsWith('http:')) {
                errorMessage += ' This may be due to a mixed content security error.';
            }
            tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center;">${errorMessage}</td></tr>`;
        }
    }

    // --- Interactive Card Logic ---
	const cards = document.querySelectorAll(".card");
	const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

	cards.forEach((card) => {
		const content = card.querySelector(".card-content");
		const rotationFactor =
			parseFloat(card.getAttribute("data-rotation-factor")) || 2;

		if (!isTouchDevice) {
			card.addEventListener("mousemove", (e) => {
				const rect = card.getBoundingClientRect();
				const x = e.clientX - rect.left;
				const y = e.clientY - rect.top;

				const centerX = rect.width / 2;
				const centerY = rect.height / 2;
				const rotateY = (rotationFactor * (x - centerX)) / centerX;
				const rotateX = (-rotationFactor * (y - centerY)) / centerY;

				content.style.transform = `
          rotateX(${rotateX}deg) 
          rotateY(${rotateY}deg)
        `;

				card.style.setProperty("--x", `${(x / rect.width) * 100}%`);
				card.style.setProperty("--y", `${(y / rect.height) * 100}%`);
			});

			card.addEventListener("mouseleave", () => {
				content.style.transform = "rotateX(0) rotateY(0)";

				content.style.transition = "transform 0.5s ease";
				setTimeout(() => {
					content.style.transition = "";
				}, 500);
			});
		}

		const randomDelay = Math.random() * 2;
		card.style.animation = `cardFloat 4s infinite alternate ease-in-out ${randomDelay}s`;
	});

	const style = document.createElement("style");
	style.textContent = `
    @keyframes cardFloat {
      0% { transform: translateY(0); }
      100% { transform: translateY(-5px); }
    }
    @media (min-width: 768px) {
      @keyframes cardFloat {
        100% { transform: translateY(-8px); }
      }
    }
    @media (min-width: 1024px) {
      @keyframes cardFloat {
        100% { transform: translateY(-10px); }
      }
    }
  `;
	document.head.appendChild(style);

	const buttons = document.querySelectorAll(".card-button");
	buttons.forEach((button) => {
		button.addEventListener("click", (e) => {
			e.stopPropagation(); // Prevent card click event when clicking a link
		});
	});
});
