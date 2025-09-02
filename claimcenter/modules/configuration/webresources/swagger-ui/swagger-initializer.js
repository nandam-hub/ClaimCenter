window.onload = function() {
  //<editor-fold desc="Changeable Configuration Block">

  // the following lines will be replaced by docker/configurator, when it runs in a docker-container


  // The /apis endpoint should be there on most installations, and the servlet is generally rooted
  // at /rest, so attempt to construct the default URL by deconstructing the current window location
  // to figure out the scheme, host, post, and base servlet context
  var location = window.location;
  var baseUrl = location.protocol + "//" + location.host;
  var servletContext = location.pathname.split("/")[1];
  // If the first path element is "resources" there is no servlet context, otherwise add it to the path
  var apisSwagger = baseUrl + (servletContext === "resources" ? "" : "/" + servletContext) + "/rest/apis/swagger.json";
  window.ui = SwaggerUIBundle({
    url: apisSwagger,
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl
    ],
    layout: "StandaloneLayout"
  });

  //</editor-fold>
};
