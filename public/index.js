document.addEventListener("DOMContentLoaded", () => {

  // Modal close on ×
  const modal = document.getElementById("svg-modal");
  const closeModal = document.getElementById("close-modal");
  if (closeModal && modal) {
    closeModal.onclick = function() {
      modal.style.display = "none";
    };
  }

  document.getElementById("matrix-rank").innerText = "16";
  document.getElementById("num-singular").innerText = "16";
  document.getElementById("num-data").innerText = "256";
  document.getElementById("num-model").innerText = "256";
  document.getElementById("data-type").innerText = "Real, Continuous";

  const svdEquationEl = document.getElementById("svd-equation");
  if (svdEquationEl) {
    svdEquationEl.innerHTML = `\\[ \\mathbf{A} = \\mathbf{U}\\, \\Sigma\\, \\mathbf{V}^T \\]`;
    if (typeof renderMathInElement !== "undefined") renderMathInElement(svdEquationEl);
  }

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

  let globalSelectedIndex = 0;
  let globalPattern = "fan";
  const rayPatternSel = document.getElementById("ray-pattern");
  if (rayPatternSel) {
    rayPatternSel.addEventListener("change", (e) => {
      globalPattern = e.target.value;
      reloadSVG(globalSelectedIndex, globalPattern);
    });
  }

  reloadSVG(globalSelectedIndex, globalPattern);

  document.getElementById("source-depth").addEventListener("change", (e) => {
    const val = e.target.value;
  if (val === "all") {
    reloadSVG("all", "crossing");
  } else {
    globalSelectedIndex = parseInt(val);
    reloadSVG(globalSelectedIndex, "fan");
  }
  });

  // PNG pop-up on "Show SVD Diagram PNG" button if present
  const showPngBtn = document.getElementById("show-png-btn");
  if (showPngBtn && modal) {
    showPngBtn.addEventListener("click", () => {
      const img = document.getElementById("modal-img");
      if (img) {
        img.src = 'diagram.png';
        modal.style.display = "flex";
      }
    });
  }

  // --- Auto-popup after Generate Heatmap ---
  document.getElementById("generate-heatmap-btn").addEventListener("click", async () => {
    const input = document.getElementById("k-values").value;
    let ks = [];
    if (input.trim()) {
      ks = input.split(",").map(k => parseInt(k.trim())).filter(k => !isNaN(k));
      if (ks.length < 1 || ks.length > 8) {
        alert("Please enter between 1 and 8 valid integer K values.");
        return;
      }
    }
    if (ks.length === 0) {
      showCombinedHeatmap("all_heatmaps.png");
    } else {
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
  // Hide any in-page static image if present
  const heatMapDiv = document.getElementById("heatMap");
  if (heatMapDiv) heatMapDiv.style.display = "none";

  // Get modal and modal image container elements
  const modal = document.getElementById("svg-modal");
  const modalContent = document.getElementById("modal-img-container");

  if (modal && modalContent) {
    // Clear previous images
    modalContent.innerHTML = "";

    // Add the image (your src) with cache busting
    const img = document.createElement("img");
    img.src = src.includes("?t=") ? src : src + "?t=" + Date.now();
    img.style.maxWidth = "90vw";
    img.style.maxHeight = "80vh";

    // When image loads, show modal
    img.onload = function() {
      modal.style.display = "flex";
    };

    modalContent.appendChild(img);
  }
}

// Modal close handler should be set once in your JS initialization
document.getElementById("close-modal").onclick = function() {
  document.getElementById("svg-modal").style.display = "none";
};


  function populateDepthDropdown() {
    const depthDropdown = document.getElementById("source-depth");
    depthDropdown.innerHTML = "";

    // Add the ALL option at the top
    let optionAll = document.createElement("option");
    optionAll.value = "all";
    optionAll.text = "ALL (CROSSING)";
    depthDropdown.appendChild(optionAll);

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

  // Larger SVG design space
  const svgWidth = 1200, svgHeight = 1000;
  const srcX = 150;
  const recX = svgWidth - 150;

  // Number of source/receiver points (adjust for your dropdown!)
  const N = 17;
  const marginTop = 80, marginBot = 80;
  const plotHeight = svgHeight - marginTop - marginBot;

  // Vertical positions
  const yPosArr = Array.from({length: N}, (_, i) =>
    marginTop + i * (plotHeight / (N - 1))
  );

  const svg = d3.select("#plot")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("background-color", "white");

  // Grid (optional)
  const gridSpacing = 50;
  for (let x = 0; x <= svgWidth; x += gridSpacing) {
    svg.append("line")
      .attr("x1", x).attr("y1", 0)
      .attr("x2", x).attr("y2", svgHeight)
      .attr("stroke", "#eee").attr("stroke-width", 1);
  }
  for (let y = 0; y <= svgHeight; y += gridSpacing) {
    svg.append("line")
      .attr("x1", 0).attr("y1", y)
      .attr("x2", svgWidth).attr("y2", y)
      .attr("stroke", "#eee").attr("stroke-width", 1);
  }

  // Well lines
  svg.append("line").attr("x1", srcX).attr("y1", 0).attr("x2", srcX).attr("y2", svgHeight).attr("stroke", "black").attr("stroke-width", 5);
  svg.append("line").attr("x1", recX).attr("y1", 0).attr("x2", recX).attr("y2", svgHeight).attr("stroke", "black").attr("stroke-width", 5);

  // Source circles (clickable unless 'all')
  yPosArr.forEach((y, i) => {
    svg.append("circle")
      .attr("cx", srcX)
      .attr("cy", y)
      .attr("r", selectedIndex !== "all" && i === selectedIndex ? 14 : 9)
      .style("fill", selectedIndex !== "all" && i === selectedIndex ? "#FF7F50" : "#FFB6B9")
      .style("stroke", "black")
      .style("cursor", selectedIndex !== "all" ? "pointer" : "default")
      .on("click", function () {
        if (selectedIndex !== "all") {
          globalSelectedIndex = i;
          document.getElementById("source-depth").selectedIndex = i + 1; // +1 because 'ALL' is 0
          reloadSVG(i);
        }
      });
  });

  // Receiver circles
  yPosArr.forEach((y) => {
    svg.append("circle")
      .attr("cx", recX)
      .attr("cy", y)
      .attr("r", 9)
      .style("fill", "#90EE90")
      .style("stroke", "black");
  });

  // Draw "CROSSING" pattern if 'ALL' selected; otherwise draw "FAN"
  if (selectedIndex === "all") {
    // Crossing: blue or purple for all-to-all
    yPosArr.forEach((sy) => {
      yPosArr.forEach((ry) => {
        svg.append("line")
          .attr("x1", srcX)
          .attr("y1", sy)
          .attr("x2", recX)
          .attr("y2", ry)
          .attr("stroke", "#C058F3")
          .attr("stroke-width", 1.2)
          .attr("opacity", 0.25);
      });
    });
  } else {
    // Normal fan
    yPosArr.forEach(receiverY => {
      svg.append("line")
        .attr("x1", srcX)
        .attr("y1", yPosArr[selectedIndex])
        .attr("x2", recX)
        .attr("y2", receiverY)
        .attr("stroke", "green")
        .attr("stroke-width", 3)
        .attr("opacity", 0.7);
    });
  }
}


});
