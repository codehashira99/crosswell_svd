document.addEventListener("DOMContentLoaded", () => {

    // Populate stats/info cards
  document.getElementById("matrix-rank").innerText = "16";      // Replace with your dynamic value if available
  document.getElementById("num-singular").innerText = "16";     // Example value
  document.getElementById("num-data").innerText = "256";
  document.getElementById("num-model").innerText = "256";
  document.getElementById("data-type").innerText = "Real, Continuous";

  // Render SVD equation using KaTeX
  const svdEquationEl = document.getElementById("svd-equation");
  if (svdEquationEl) {
    svdEquationEl.innerHTML = `\\[ \\mathbf{A} = \\mathbf{U}\\, \\Sigma\\, \\mathbf{V}^T \\]`;
    if (typeof renderMathInElement !== "undefined") renderMathInElement(svdEquationEl);
  }

  // Initialize dummy L-curve plot using Plotly (optional later replace with real data)
  if (window.Plotly && document.getElementById("lcurve-plot")) {
    Plotly.newPlot('lcurve-plot', [{
      x: [1, 2, 3, 4, 5],
      y: [10, 7, 4, 2, 1],
      mode: 'lines+markers',
      line: { color: '#1f77b4' },
      name: 'L-curve'
    }], {
      xaxis: { title: 'Residual norm' },
      yaxis: { title: 'Solution norm' },
      margin: { t: 10 }
    });
  }
  populateDepthDropdown();
  reloadSVG(0); // initial ray path drawing

  document.getElementById("reload-button").addEventListener("click", () => {
    const selectedIndex = parseInt(document.getElementById("source-depth").value);
    reloadSVG(selectedIndex);
  });

  document.getElementById("generate-heatmap-btn").addEventListener("click", async () => {
    const input = document.getElementById("k-values").value;
    let ks = [];

    if (input.trim()) {
      ks = input.split(",")
        .map(k => parseInt(k.trim()))
        .filter(k => !isNaN(k));
    }

    if (ks.length > 0 && (ks.length < 2 || ks.length > 6)) {
      alert("Please enter between 2 and 6 valid integer K values.");
      return;
    }

    if (ks.length === 0) {
      // No user input, load the default static PNG
      showCombinedHeatmap("all_heatmaps.png");
    } else {
      // Call backend to generate PNG with selected Ks
      try {
        const response = await fetch("/generate-heatmap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ks }),
        });

        if (!response.ok) throw new Error("Server error");

        const data = await response.json();
        showCombinedHeatmap(data.imageUrl);
      } catch (error) {
        
        // alert("Failed to generate heatmaps: " + error.message);
       console.warn("Suppressed heatmap generation error:", error.message);

      }
    }
  });

  function showCombinedHeatmap(src) {
  // Hide individual heatmaps div if any
  const heatMapDiv = document.getElementById("heatMap");
  if (heatMapDiv) heatMapDiv.style.display = "none";
  // Show combined heatmap PNG with cache busting
  const img = document.getElementById("combined-heatmap");
  if (img) {
    img.src = src + "?t=" + Date.now();
    img.style.display = "block";
  }
} 


  // Your existing functions to populate dropdown and draw ray path:
  function populateDepthDropdown() {
    const depthDropdown = document.getElementById("source-depth");
    depthDropdown.innerHTML = "";

    const dz = 100, z_min = 100, z_max = 1600;
    let zs = [];

    for (let z = z_min; z <= z_max; z += dz) zs.push(z);
    zs.reverse();

    zs.forEach((depth, i) => {
      let option = document.createElement("option");
      option.value = i;
      option.text = `Depth ${depth}`;
      depthDropdown.appendChild(option);
    });
  }

  function reloadSVG(selectedIndex) {
    const svgContainer = document.getElementById("plot");
    svgContainer.innerHTML = "";
    const width = 900, height = 700;

    const svg = d3.select("#plot")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("background-color", "white");

      // Add grid lines
    const gridSpacing = 50;
    for (let x = 0; x <= width; x += gridSpacing) {
    svg.append("line")
    .attr("x1", x)
    .attr("y1", 0)
    .attr("x2", x)
    .attr("y2", height)
    .attr("stroke", "#eee")
    .attr("stroke-width", 1);
    }
    for (let y = 0; y <= height; y += gridSpacing) {
    svg.append("line")
    .attr("x1", 0)
    .attr("y1", y)
    .attr("x2", width)
    .attr("y2", y)
    .attr("stroke", "#eee")
    .attr("stroke-width", 1);
    }


    const dz = 40, z_min = -640, z_max = -40;
    let zs = [];
    for (let z = z_min; z <= z_max; z += dz) zs.push(z);
    const zr = zs.slice();
    zs.reverse();

    svg.append("line")
      .attr("x1", 100).attr("y1", 0)
      .attr("x2", 100).attr("y2", height)
      .attr("stroke", "black").attr("stroke-width", 3);

    svg.append("line")
      .attr("x1", 750).attr("y1", 0)
      .attr("x2", 750).attr("y2", height)
      .attr("stroke", "black").attr("stroke-width", 3);

    zs.forEach((depth, i) => {
      svg.append("circle")
        .attr("cx", 100)
        .attr("cy", height / 2 + depth + 320)
        .attr("r", i === selectedIndex ? 8 : 4)
        .style("fill", i === selectedIndex ? "#FF7F50" : "#FFB6B9")
        .style("stroke", "black");
    });

    zr.forEach(depth => {
      svg.append("circle")
        .attr("cx", 750)
        .attr("cy", height / 2 + depth + 320)
        .attr("r", 4)
        .style("fill", "#90EE90")
        .style("stroke", "black");
    });

    zr.forEach(receiverDepth => {
      svg.append("line")
        .attr("x1", 100)
        .attr("y1", height / 2 + zs[selectedIndex] + 320)
        .attr("x2", 750)
        .attr("y2", height / 2 + receiverDepth + 320)
        .attr("stroke", "green")
        .attr("stroke-width", 2)
        .attr("opacity", 0.7);
    });
  }
});
