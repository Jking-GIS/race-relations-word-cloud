# Embeddable Word Cloud App

#### Configuration Steps
1. Open the `all.html` file
2. You will find a section near the top that has `// TO BE REPLACED FOR CONFIGURATION` before and after a chunk of variables
3. For each variable that you want to configure, you can modify it in this section
4. Some of the things that are configurable include:
    - surveyLayerUrl - the url to the survey service
    - statesLayerUrl - the url to the states service
    - webMapId - the id to the web map
    - surveyQuestionField - the question/answer field from the survey service
    - surveyDescriptionField - the descriptive text field from the survey service
    - stateNameField - the field form the states service that holds the state name
    - extraStatePopupContent - you can add any additional popup content items here for the states layer, when you click on a word from the word cloud. You can refer to the specification at https://developers.arcgis.com/javascript/latest/api-reference/esri-PopupTemplate.html#content, if you want to configure additional sections
  h. wordCloudColor - color of the word cloud items
  i. wordCloudSelectedColor - color of the selected word cloud item
5. Once you are done changing these things, you can copy the entire contents of the `all.html` file, and paste it into the html code section of an experience builder element.

*NOTE: All services and surveys must currently be public and shared with everyone for this embeddable app to work*
