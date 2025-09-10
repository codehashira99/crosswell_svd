document.addEventListener("DOMContentLoaded", () => {
  // Modal close on ×
  const modal = document.getElementById("svg-modal");
  const closeModal = document.getElementById("close-modal");
  if (closeModal && modal) {
    closeModal.onclick = function() {
      modal.style.display = "none";
    };
  }

  // Populate stats
  document.getElementById("matrix-rank").innerText = "16";
  document.getElementById("num-singular").innerText = "16";
  document.getElementById("num-data").innerText = "256";
  document.getElementById("num-model").innerText = "256";
  document.getElementById("data-type").innerText = "Real, Continuous";

  // Render SVD equation
  const svdEquationEl = document.getElementById("svd-equation");
  if (svdEquationEl) {
    svdEquationEl.innerHTML = `\\[ \\mathbf{A} = \\mathbf{U}\\, \\Sigma\\, \\mathbf{V}^T \\]`;
    if (typeof renderMathInElement !== "undefined") renderMathInElement(svdEquationEl);
  }

  // Example L-curve plot
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

        if (data.heatmaps || data.matrices) {
          const allSources = [];
          if (data.heatmaps) allSources.push(...data.heatmaps);   // ✅ green/yellow heatmaps
          if (data.matrices) allSources.push(...data.matrices);   // ✅ resolution matrices
          showCombinedHeatmap(allSources);
        } else if (data.imageUrls) {
          showCombinedHeatmap(data.imageUrls); // old style
        } else if (data.imageUrl) {
          showCombinedHeatmap([data.imageUrl]);
        }

      } catch (error) {
        console.warn("Suppressed heatmap generation error:", error.message);
      }
    }
  });

  // --- Modal display function ---
  function showCombinedHeatmap(srcs) {
    const modal = document.getElementById("svg-modal");
    const heatmapsRow = document.getElementById("heatmaps-row");
    const resolutionRow = document.getElementById("resolution-row");

    if (!modal || !heatmapsRow || !resolutionRow) return;

    // Clear old
    heatmapsRow.innerHTML = "";
    resolutionRow.innerHTML = "";

    const sources = Array.isArray(srcs) ? srcs : [srcs];

    sources.forEach(src => {
      const img = document.createElement("img");
      img.src = src.includes("?t=") ? src : src + "?t=" + Date.now();
      img.style.maxWidth = "45vw";
      img.style.maxHeight = "75vh";
      img.style.borderRadius = "8px";
      img.style.margin = "0 8px";

      if (src.toLowerCase().includes("heatmap")) {
        heatmapsRow.appendChild(img);   // ✅ green/yellow heatmaps
      } else {
        resolutionRow.appendChild(img); // ✅ matrices
      }
    });

    modal.style.display = "flex";
  }

  // Depth dropdown builder
  function populateDepthDropdown() {
    const depthDropdown = document.getElementById("source-depth");
    depthDropdown.innerHTML = "";

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

  // Raypath SVG renderer
  function reloadSVG(selectedIndex) {
    const svgContainer = document.getElementById("plot");
    svgContainer.innerHTML = "";

    const svgWidth = 1400, svgHeight = 1100;
    const srcX = 150;
    const recX = svgWidth - 150;
    const N = 17;
    const marginTop = 80, marginBot = 80;
    const plotHeight = svgHeight - marginTop - marginBot;

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

      // Axis labels and title
svg.append("text")
  .attr("x", 35)
  .attr("y", svgHeight / 2)
  .attr("text-anchor", "middle")
  .attr("transform", `rotate(-90, 35, ${svgHeight / 2})`)
  .style("font-size", "21px")
  .style("fill", "#222")
  .text("Source Depth");

svg.append("text")
  .attr("x", svgWidth - 25)
  .attr("y", svgHeight / 2)
  .attr("text-anchor", "middle")
  .attr("transform", `rotate(-90, ${svgWidth - 25}, ${svgHeight / 2})`)
  .style("font-size", "21px")
  .style("fill", "#222")
  .text("Receiver Depth");

svg.append("text")
  .attr("x", svgWidth / 2)
  .attr("y", 40)
  .attr("text-anchor", "middle")
  .style("font-size", "24px")
  .style("fill", "#222")
  .text("SVD Ray Path Diagram: Depth vs Depth");


    // Grid
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

    // Sources
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
            document.getElementById("source-depth").selectedIndex = i + 1;
            reloadSVG(i);
          }
        });
    });

    // Receivers
    yPosArr.forEach((y) => {
      svg.append("circle")
        .attr("cx", recX)
        .attr("cy", y)
        .attr("r", 9)
        .style("fill", "#90EE90")
        .style("stroke", "black");
    });

    // Lines
    if (selectedIndex === "all") {
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
