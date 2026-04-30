// Globo 3D interattivo (D3 orthographic projection).
//
// - Sfera + reticolo + paesi caricati da TopoJSON (world-atlas).
// - Drag del mouse per ruotare (lambda + phi).
// - Pin proiettati sulla sfera e nascosti automaticamente quando
//   passano sul retro (great-circle distance dal centro vista > 90°).
// - Click su pin → apre lo stesso modal usato dalla mappa piatta.
//
// Dipendenze (caricate da CDN in index.html):
//   - d3@7 (window.d3)
//   - topojson-client@3 (window.topojson)
// Per uso offline: scaricare i due file in web/js/lib/ e usare i
// path locali invece di quelli CDN.

(function() {
  var DATA_URL  = "data/discoveries.json";
  var WORLD_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

  var loaded = false;
  var initialized = false;
  var discoveries = [];
  var world = null;
  var rotation = [-10, -20, 0]; // [lambda, phi, gamma] - vista iniziale Europa/Africa

  var svg, projection, path;
  var sphereG, graticuleG, countriesG, pinsG;
  var size = 0;

  function ensure() {
    if (loaded) {
      requestAnimationFrame(resize);
      return;
    }
    var loadDiscoveries = fetch(DATA_URL).then(function(r) {
      if (!r.ok) throw new Error("discoveries-missing");
      return r.json();
    });
    var loadWorld = fetch(WORLD_URL).then(function(r) {
      if (!r.ok) throw new Error("world-missing");
      return r.json();
    });

    Promise.all([loadDiscoveries, loadWorld]).then(function(results) {
      discoveries = results[0];
      // Precalcola il numero progressivo (per i pin)
      discoveries.forEach(function(d, i) { d._num = i + 1; });
      world = results[1];
      loaded = true;
      requestAnimationFrame(init);
    }).catch(function(err) {
      console.warn("Globe data load failed:", err);
    });
  }

  function init() {
    if (initialized) return;
    if (!window.d3 || !window.topojson) {
      console.warn("D3 / topojson non disponibili: il globo non può essere renderizzato.");
      return;
    }

    svg = d3.select("#globe-svg");

    // Filtro SVG per dare un effetto "mosso" alle linee dei contorni
    var defs = svg.append("defs");
    var filter = defs.append("filter")
      .attr("id", "globe-sketch")
      .attr("x", "-5%").attr("y", "-5%")
      .attr("width", "110%").attr("height", "110%");
    filter.append("feTurbulence")
      .attr("type", "fractalNoise")
      .attr("baseFrequency", "0.025")
      .attr("numOctaves", "1")
      .attr("seed", "3");
    filter.append("feDisplacementMap")
      .attr("in", "SourceGraphic")
      .attr("scale", "2.5");

    sphereG    = svg.append("g").attr("class", "globe__layer-sphere");
    graticuleG = svg.append("g").attr("class", "globe__layer-graticule");
    countriesG = svg.append("g").attr("class", "globe__layer-countries");
    pinsG      = svg.append("g").attr("class", "globe__layer-pins");

    // Drag handler
    var dragStart;
    svg.call(d3.drag()
      .on("start", function(event) {
        dragStart = { x: event.x, y: event.y, rotation: rotation.slice() };
      })
      .on("drag", function(event) {
        if (!dragStart) return;
        var sensitivity = 360 / size;
        rotation[0] = dragStart.rotation[0] + (event.x - dragStart.x) * sensitivity;
        rotation[1] = dragStart.rotation[1] - (event.y - dragStart.y) * sensitivity;
        rotation[1] = Math.max(-90, Math.min(90, rotation[1]));
        projection.rotate(rotation);
        renderPaths();
      }));

    initialized = true;
    resize();
  }

  function resize() {
    if (!initialized) return;
    var container = document.getElementById("globe-container");
    if (!container) return;
    var rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    size = Math.min(rect.width, rect.height) * 0.95;

    svg.attr("viewBox", "0 0 " + size + " " + size)
       .attr("width",  size)
       .attr("height", size);

    projection = d3.geoOrthographic()
      .scale(size / 2 - 10)
      .translate([size / 2, size / 2])
      .rotate(rotation)
      .clipAngle(90);

    path = d3.geoPath(projection);

    renderPaths();
  }

  function renderPaths() {
    if (!initialized || !world) return;

    // Sfera
    var sphereData = sphereG.selectAll("path").data([{ type: "Sphere" }]);
    sphereData.enter().append("path").attr("class", "globe__sphere")
      .merge(sphereData).attr("d", path);

    // Reticolo
    var grat = d3.geoGraticule().step([20, 20])();
    var gratSel = graticuleG.selectAll("path").data([grat]);
    gratSel.enter().append("path").attr("class", "globe__graticule")
      .merge(gratSel).attr("d", path);

    // Paesi
    var countries = topojson.feature(world, world.objects.countries);
    var c = countriesG.selectAll("path").data(countries.features);
    c.enter().append("path").attr("class", "globe__country")
      .merge(c).attr("d", path);
    c.exit().remove();

    renderPins();
  }

  function renderPins() {
    if (!projection) return;
    var rotate = projection.rotate();
    var center = [-rotate[0], -rotate[1]];

    // Tieni solo i pin sul lato visibile della sfera
    var visible = discoveries.filter(function(d) {
      if (typeof d.lat !== "number" || typeof d.lng !== "number") return false;
      var dist = d3.geoDistance([d.lng, d.lat], center);
      return dist < Math.PI / 2 - 0.02; // un filo dentro il bordo
    });

    var pins = pinsG.selectAll("g.globe__pin").data(visible, function(d) { return d.id; });

    var enter = pins.enter().append("g")
      .attr("class", "globe__pin")
      .on("click", function(event, d) {
        event.stopPropagation();
        if (window.Modal && window.Modal.open) window.Modal.open(d);
      });

    enter.append("circle").attr("class", "globe__pin-bg").attr("r", 13);
    enter.append("text").attr("class", "globe__pin-num")
      .attr("dy", "0.35em")
      .text(function(d) { return String(d._num); });

    pins.merge(enter).attr("transform", function(d) {
      var p = projection([d.lng, d.lat]);
      return "translate(" + p[0] + "," + p[1] + ")";
    });

    pins.exit().remove();
  }

  // Pulsante "Fine" → ultima slide
  var fineBtn = document.getElementById("globe-btn-fine");
  if (fineBtn) {
    fineBtn.addEventListener("click", function() {
      window.Slides && window.Slides.goToEnd();
      window.App && window.App.show("presentation");
    });
  }

  window.addEventListener("resize", function() {
    requestAnimationFrame(resize);
  });

  window.Globe = { ensure: ensure };
})();
