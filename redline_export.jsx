﻿// This script performs the following tasks://    - Enumerate all layer comps//    - Apply the comp and export it as a PNG//    - Create a redline layer overlaying type information//    - Exports the redline version as a PNG//// All files are saved in the same folder as the source PSD//// Written by Brian Romanko// Based on the work of David Klawitter and Tom Krcha//#target photoshopmain();///////////////////////////////////////////////////////////////////////////// Function: getVisibleTextLayers// Usage: Does a recursive search of layers and collects all text layer references//        in to a single array, layers.// Input: Document, Array///////////////////////////////////////////////////////////////////////////function getVisibleTextLayers(docOrLayerSet, textLayers) {  var layersCount = docOrLayerSet.layers.length;  for (var layersIndex = 0; layersIndex < layersCount; layersIndex++) {    var layer = docOrLayerSet.layers[layersIndex];    if (layer.visible) {      if (layer.typename == "LayerSet") {        getVisibleTextLayers(layer, textLayers);      } else if (isTextLayer(layer)) {        textLayers.push(layer);      }    }  }}///////////////////////////////////////////////////////////////////////////// Function: isTextLayer// Usage: Determines whether or not the layer ref passed in is a text layer// Input: ArtLayer// Return: true if the layer is a text layer///////////////////////////////////////////////////////////////////////////function isTextLayer(layer) {  if (layer.typename == "ArtLayer") {    if (layer.kind == "LayerKind.TEXT") {      return true;    }  }  return false;}///////////////////////////////////////////////////////////////////////////// Function: createHintLayer// Usage: Creates a hint layer describing a text layer// Input: ArtLayer// Return: Layer containing the hint information///////////////////////////////////////////////////////////////////////////function createHintLayer(artLayer) {  var artLayerRef = activeDocument.artLayers.add();  artLayerRef.kind = LayerKind.TEXT;  var textItemRef = artLayerRef.textItem;  textItemRef.contents = getFontDisplay(artLayer);  var textColor = new SolidColor();  textColor.rgb.red = 255;  textColor.rgb.green = 255;  textColor.rgb.blue = 255;  textItemRef.color = textColor;  textItemRef.size = 10;  return artLayerRef;}///////////////////////////////////////////////////////////////////////////// Function: userFriendlyConstant// Usage: Converts constants to user-friendly copy// Input: string// Return: a string///////////////////////////////////////////////////////////////////////////function userFriendlyConstant(obj) {  if (obj == "TypeUnits.PIXELS")    return "px";  else if (obj == "TypeUnits.POINTS") {    return "pt";  } else {    return obj;  }}///////////////////////////////////////////////////////////////////////////// Function: positionLayer// Usage: Moves a layer to a new position// Input: layerObject, Number, Number///////////////////////////////////////////////////////////////////////////function positionLayer(lyr, x, y) {  if (lyr.iisBackgroundLayer || lyr.positionLocked) {    return;  }  var layerBounds = lyr.bounds;  var layerX = layerBounds[0].value;  var layerY = layerBounds[1].value;  var deltaX = x - layerX;  var deltaY = y - layerY;  lyr.translate(deltaX, deltaY);}///////////////////////////////////////////////////////////////////////////// Function: fillLayer// Usage: Fills a document selection with color used bounds of the provided layer object// Input: Layer///////////////////////////////////////////////////////////////////////////function fillLayer(fillLayer, bounds) {  activeDocument.activeLayer = fillLayer;  var a = [bounds[0], bounds[1]];  var b = [bounds[2], bounds[1]];  var c = [bounds[0], bounds[3]];  var d = [bounds[2], bounds[3]];  var fillColor = new SolidColor();  fillColor.rgb.red = 255;  fillColor.rgb.green = 0;  fillColor.rgb.blue = 0;  activeDocument.selection.select([c, d, b, a], SelectionType.REPLACE, 0, false);  activeDocument.selection.expand('10 pixels');  activeDocument.selection.fill(fillColor, ColorBlendMode.NORMAL, 80, false);}// Available LayerStyle properties: frameFX, solidFill, gradientFill, chromeFX, bevelEmboss, innerGlow, outerGlow, innerShadow, dropShadow.opacity/distancefunction getLayerStyles(artLayer) {  activeDocument.activeLayer = artLayer;  var ref = new ActionReference();  ref.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID( "Ordn" ), charIDToTypeID( "Trgt" ) );  var layerDesc = executeActionGet(ref);  var obj;  if(layerDesc.hasKey(stringIDToTypeID('layerEffects'))){    stylesDesc = layerDesc.getObjectValue(stringIDToTypeID('layerEffects'));    obj = actionDescriptorToObject(stylesDesc);  }  return obj;}function actionDescriptorToObject(desc){  var obj = {};  var len = desc.count;  for(var i=0;i<len;i++){    var key = desc.getKey(i);    obj[typeIDToStringID(key)] = getValueByType(desc,key);  }  return obj;}// Get a value from an ActionDescriptor by a type defined by a key// ALIASTYPE BOOLEANTYPE CLASSTYPE DOUBLETYPE ENUMERATEDTYPE INTEGERTYPE LARGEINTEGERTYPE LISTTYPE OBJECTTYPE RAWTYPE REFERENCETYPE STRINGTYPE UNITDOUBLEfunction getValueByType(desc,key){  var type = desc.getType(key);  var value = null;  switch(type){    case DescValueType.ALIASTYPE:      value = "alias";      break;    case DescValueType.BOOLEANTYPE:      value = desc.getBoolean(key);      break;    case DescValueType.CLASSTYPE:      value = desc.getClass(key);      break;    case DescValueType.OBJECTTYPE:      value = actionDescriptorToObject(desc.getObjectValue(key));//+" - "+desc.getObjectType(key);      break;    case DescValueType.ENUMERATEDTYPE:      value = typeIDToStringID(desc.getEnumerationValue(key));      break;    case DescValueType.DOUBLETYPE:      value = desc.getDouble(key);      break;    case DescValueType.INTEGERTYPE:      value = desc.getInteger(key);      break;    case DescValueType.LARGEINTEGERTYPE:      value = desc.getLargeInteger(key);      break;    case DescValueType.LISTTYPE:      value = desc.getList(key);      break;    case DescValueType.RAWTYPE:      // not implemented      break;    case DescValueType.REFERENCETYPE:      value = desc.getReference(key);      break;    case DescValueType.STRINGTYPE:      value = desc.getString(key);      break;    case DescValueType.UNITDOUBLE:      value = desc.getUnitDoubleValue(key);      break;  }  return value;}///////////////////////////////////////////////////////////////////////////// Function: getFontDisplay// Usage: Creates a string describing a text layer// Input: ArtLayer// Return: string describing the layer///////////////////////////////////////////////////////////////////////////function getFontDisplay(artLayer) {  var text = artLayer.textItem.font + '\r' +      Math.round(artLayer.textItem.size) + ' ' + userFriendlyConstant(app.preferences.typeUnits) + '\r' +      '#' + artLayer.textItem.color.rgb.hexValue;  var layerStyle = getLayerStyles(artLayer);  if (layerStyle && layerStyle.dropShadow) {    var ds = layerStyle.dropShadow;    text += '\rShadow #';    if (ds.color.red && ds.color.grain && ds.color.blue) {        text += ds.color.red.toString(16) +        ds.color.grain.toString(16) +  // WTF?!        ds.color.blue.toString(16);    } else {        text += '000000 ';    }        text +=         ds.opacity + '% ' +        ds.localLightingAngle + 'º ' +        ds.distance + 'px';  }  return text;}///////////////////////////////////////////////////////////////////////////// Function: exportPng// Usage: Exports the active document as a PNG// Input: string///////////////////////////////////////////////////////////////////////////function exportPng(fileName) {  var docExportOptions = new ExportOptionsSaveForWeb();  docExportOptions.format = SaveDocumentType.PNG;  docExportOptions.transparency = true;  docExportOptions.blur = 0.0;  docExportOptions.includeProfile = false;  docExportOptions.interlaced = false;  docExportOptions.optimized = true;  docExportOptions.quality = 100;  docExportOptions.PNG8 = false;  var file = new File(activeDocument.path + '/' + fileName);  activeDocument.exportDocument(file, ExportType.SAVEFORWEB, docExportOptions);}///////////////////////////////////////////////////////////////////////////// Function: pad// Usage: Pads a number with leading values// Input: Integer, Integer, String// Return: The padded string///////////////////////////////////////////////////////////////////////////function pad(num, width, zeroValue) {  zeroValue = zeroValue || '0';  num = num + '';  return num.length >= width ? num : new Array(width - num.length + 1).join(zeroValue) + num;}///////////////////////////////////////////////////////////////////////////// Function: createRedlines// Usage: Creates the normal and redline versions of the current document state// Input: String///////////////////////////////////////////////////////////////////////////function createRedlines(baseFilename) {  exportPng(baseFilename + '.png');  var textLayers = [];  getVisibleTextLayers(app.activeDocument, textLayers);  var layerSet = activeDocument.layerSets.add();  var fillLayerRef = activeDocument.artLayers.add();  fillLayerRef.kind = LayerKind.NORMAL;  fillLayerRef.move(layerSet, ElementPlacement.INSIDE);  for (var layerIndex = 0; layerIndex < textLayers.length; layerIndex++) {    var layer = textLayers[layerIndex];    var artLayerRef = createHintLayer(layer);    artLayerRef.move(layerSet, ElementPlacement.INSIDE);    positionLayer(artLayerRef, layer.bounds[0], layer.bounds[1]);    fillLayer(fillLayerRef, artLayerRef.bounds);  }  layerSet.merge();  exportPng(baseFilename + '_redline.png');}function main() {  if (documents.length <= 0) {    alert('Please open a document.');    return;  }  var fileName = activeDocument.name;  fileName = fileName.substr(0, fileName.lastIndexOf('.'));  var layerCompsCount = activeDocument.layerComps.length;  if (layerCompsCount <= 0) {    createRedlines(fileName)  } else {    for (var layerCompsIndex = 0; layerCompsIndex < layerCompsCount; layerCompsIndex++) {      var layerCompRef = activeDocument.layerComps[layerCompsIndex];      layerCompRef.apply();      var layerCompName = pad(layerCompsIndex, 2) + '_' + fileName + '_' + layerCompRef.name;      createRedlines(layerCompName);    }  }  alert('All done! Your files are at ' + activeDocument.path);}