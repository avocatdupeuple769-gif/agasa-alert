const React = require("react");
const { View } = require("react-native");

const MapView = (props) => React.createElement(View, props);
MapView.displayName = "MapView";

const Marker = (props) => React.createElement(View, props);
Marker.displayName = "Marker";

const Callout = (props) => React.createElement(View, props);
Callout.displayName = "Callout";

const Polyline = (props) => React.createElement(View, props);
Polyline.displayName = "Polyline";

const Circle = (props) => React.createElement(View, props);
Circle.displayName = "Circle";

module.exports = MapView;
module.exports.default = MapView;
module.exports.Marker = Marker;
module.exports.Callout = Callout;
module.exports.Polyline = Polyline;
module.exports.Circle = Circle;
