(this["webpackJsonphtml-generator"]=this["webpackJsonphtml-generator"]||[]).push([[0],{100:function(e,n,t){},266:function(e,n,t){},268:function(e,n,t){"use strict";t.r(n),t.d(n,"html",(function(){return r})),t.d(n,"replace",(function(){return s}));var r='<!DOCTYPE html>\n<meta charset="utf-8">\n\n\x3c!-- Load d3.js --\x3e\n<script src="https://d3js.org/d3.v4.js"><\/script>\n\n\x3c!-- Load d3-cloud --\x3e\n<script src="https://cdn.jsdelivr.net/gh/holtzy/D3-graph-gallery@master/LIB/d3.layout.cloud.js"><\/script>\n\n<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css">\n<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"><\/script>\n<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js"><\/script>\n\n\x3c!-- Load arcgis js api --\x3e\n<link\n  rel="stylesheet"\n  href="https://js.arcgis.com/4.13/esri/themes/light/main.css"\n/>\n<script src="https://js.arcgis.com/4.13/"><\/script>\n\n<style>\n  html,\n  body,\n  #wordCloudContainer {\n    width: 100%;\n    height: 100%;\n    display: inline-block;\n    background-color: rgb(34, 34, 34);\n    overflow: hidden;\n  }\n\n  #wordCloudDiv {\n    height: 100%;\n    width: 30%;\n    float: left;\n  }\n\n  #wordCloudItem {\n    width: 100%;\n    height: calc(100% - 50px);\n  }\n\n  #wordCloudItem svg g g text:hover {\n    fill: rgb(3, 252, 252) !important\n  }\n  \n  #wordCloudMapDiv {\n    height: 100%;\n    width: 70%;\n    float: right;\n  }\n\n  @media only screen and (max-width: 1000px) {\n    #wordCloudContainer {\n      display: block;\n    }\n\n    #wordCloudDiv {\n      width: 100%;\n      float: none;\n      height: 250px;\n    }\n\n    #wordCloudItem {\n      width: 100%;\n      height: 200px;\n    }\n\n    #wordCloudMapDiv {\n      width: 100%;\n      height: calc(100% - 260px);\n      float: none;\n    }\n  }\n\n  @media only screen and (max-height: 750px) and (max-width: 1000px) {\n    #wordCloudDiv {\n      height: 150px;\n    }\n\n    #wordCloudItem {\n      height: 100px;\n    }\n\n    #wordCloudMapDiv {\n      height: calc(100% - 160px);\n    }\n  }\n\n  #wordCloudLabel {\n    width: calc(100% - 20px);\n    height: 40px;\n    margin: 10px;\n    font-family: "Avenir Next", "Helvetica Neue", sans-serif;\n    font-weight: bolder;\n    font-style: unset;\n    font-size: 20px;\n    color: white;\n    text-align: center;\n  }\n\n  .esri-editor .esri-item-list__scroller {\n    max-height: 350px;\n  }\n</style>\n\n\x3c!-- Create a div where the graph will take place --\x3e\n<div id="wordCloudContainer">\n  <div id="wordCloudDiv">\n    <div id="wordCloudLabel">Click a word to filter the map and see more info!</div>\n    <div id="wordCloudItem"></div>\n  </div>\n  <div id="wordCloudMapDiv"></div>\n</div>\n\n<script>\n  require([\n    "esri/WebMap",\n    "esri/views/MapView",\n    "esri/geometry/Multipoint",\n    "esri/core/watchUtils",\n    "esri/widgets/Home",\n    "esri/identity/OAuthInfo",\n    "esri/identity/IdentityManager"\n  ], function (WebMap, MapView, Multipoint, EsriWatchUtils, Home, OAuthInfo, esriId) {\n    // TO BE REPLACED FOR CONFIGURATION\n    // -----------------------------------------------------------------\n    @@@REPLACEME@@@\n    // -----------------------------------------------------------------\n    // TO BE REPLACED FOR CONFIGURATION\n\n    if (appId) {\n      var oAuthInfo = new OAuthInfo({\n        appId: appId\n      });\n      esriId.registerOAuthInfos([oAuthInfo]);\n\n      esriId\n      .checkSignInStatus(oAuthInfo.portalUrl + "/sharing")\n      .then(() => {\n        console.log(\'Logged in!\')\n      })\n      .catch(() => {\n        console.log(\'Need to Log in\')\n      });\n    }\n\n    var maxHeight = 750;\n    var maxWidth = 1000;\n\n    var popupHasOpenedOnce = false;\n\n    var debouncing = false;\n    var allQuestionAnswers = [];\n    var lastQuestionAnswers = [];\n    var layout = null;\n    var surveyLayer = null;\n    var boundariesLayer = null;\n    var defaultPopupTemplate = null;\n\n    var currentAnswer = null;\n    var currentBoundaries = [];\n\n    var wordLocations = {};\n    var wordDupes = {};\n\n    var closingPopup = false;\n\n    var margin = {top: 10, right: 10, bottom: 10, left: 10}\n    width = ($(window).width()*(0.3)) - margin.left - margin.right,\n    height = ($(window).height()-50) - margin.top - margin.bottom;\n\n    var svg = null;\n    var waitingOnRefresh = false;\n\n    var originalSurveyLayerDefExpr = "1=1";\n    var originalBoundariesLayerDefExpr = "1=1";\n    \n    // Create a map from the referenced webmap item id\n    let webmap = new WebMap({\n      portalItem: {\n        id: webMapId\n      }\n    });\n\n    let view = new MapView({\n      container: "wordCloudMapDiv",\n      map: webmap,\n      popup: {\n        dockEnabled: true,\n        dockOptions: {\n          buttonEnabled: true,\n          breakpoint: false\n        }\n      }\n    });\n\n    view.when(() => {\n      const surveyLayer = getSurveyLayer()\n      const boundariesLayer = getBoundariesLayer()\n      originalSurveyLayerDefExpr = surveyLayer.definitionExpression\n      originalBoundariesLayerDefExpr = boundariesLayer.definitionExpression\n\n      let home = new Home({\n        view: view\n      })\n\n      view.ui.add(home, {\n        position: "top-left"\n      })\n\n      // reduceFeatures()\n      EsriWatchUtils.whenTrue(view, \'stationary\', () => {\n        if (view.extent) {\n          extentChanged()\n        }\n      });\n\n      EsriWatchUtils.watch(view.popup, \'visible\', popupVisibleChanged)\n      EsriWatchUtils.watch(view.popup, \'selectedFeature\', popupFeatureChanged)\n      $(window).on(\'resize\', resetWordCloud)\n\n      defaultPopupTemplate = getBoundariesLayer().popupTemplate\n      \n      setupSurveyLayerViewEvent()\n      filterBadWords()\n    })\n\nfunction setupWordCloud() {\n  if (!svg) {\n    if ($(window).width() <= maxWidth) {\n      width = $(window).width() - margin.left - margin.right\n\n      if ($(window).height() <= maxHeight) {\n        height = 100 - margin.top - margin.bottom\n      } else {\n        height = 200 - margin.top - margin.bottom\n      }\n    }\n\n    // append the svg object to the body of the page\n    svg = d3.select("#wordCloudItem").append("svg")\n      .attr("width", width)\n      .attr("height", height)\n    .append("g")\n      .attr("transform",\n            "translate(" + margin.left + "," + margin.top + ")");\n\n    extentChanged()\n  } else {\n    resetWordCloud()\n  }\n\n  waitingOnRefresh = false;\n}\n\nfunction setupSurveyLayerViewEvent() {\n  view.whenLayerView(getSurveyLayer()).then(function(layerView){\n    layerView.watch("updating", function(value){\n      if (!value) {\n        console.log(\'am i waiting on refresh? \' + waitingOnRefresh)\n        if (waitingOnRefresh) setupWordCloud()\n        else filterBadWords()\n      }\n    });\n  });\n}\n\nfunction filterBadWords() {\n  surveyLayer = getSurveyLayer()\n  let newQuestionAnswers = false;\n\n  const surveyQuery = surveyLayer.createQuery();\n  surveyLayer.queryFeatures(surveyQuery).then((surveyResults) => {\n    let badQuestions = []\n    surveyResults.features.forEach(feature => {\n      const question = feature.attributes[surveyQuestionField]\n      if (!allQuestionAnswers.includes(question)) {\n        allQuestionAnswers.push(question)\n        newQuestionAnswers = true;\n      }\n      \n      if (fetchBadWords().includes(question.toLowerCase()) || fetchDummyWords().includes(question.toLowerCase())) {\n        badQuestions.push(\'\\\'\' + question + \'\\\'\')\n      } else {\n        const description = feature.attributes[surveyDescriptionField]\n        if (description) {\n          const descriptionWords = description.split(/[\\s,]+/)\n          for (i = 0; i < descriptionWords.length; i++) {\n            const word = descriptionWords[i]\n            if (fetchBadWords().includes(word.toLowerCase())) {\n              badQuestions.push(\'\\\'\' + question + \'\\\'\')\n              break\n            }\n          }\n        }\n      }\n    })\n\n    if (newQuestionAnswers) {\n      if (badQuestions.length > 0) {\n        waitingOnRefresh = true\n        surveyLayer.definitionExpression = \'(\' + originalSurveyLayerDefExpr + \') AND (\' + surveyQuestionField + \' NOT IN (\' + badQuestions.join(\',\') + \'))\'\n      } else {\n        setupWordCloud()\n      }\n    }\n  });\n}\n\nfunction reduceFeatures() {\n  const surveyLayer = getSurveyLayer()\n  surveyLayer.featureReduction = {\n    type: "cluster",\n    clusterRadius: "100px",\n    popupTemplate: {\n      content: "This cluster represents {cluster_count} answers."\n    },\n    clusterMinSize: "24px",\n    clusterMaxSize: "60px",\n    labelingInfo: [{\n      // turn off deconfliction to ensure all clusters are labeled\n      deconflictionStrategy: "none",\n      labelExpressionInfo: {\n        expression: "Text($feature.cluster_count, \'#,###\')"\n      },\n      symbol: {\n        type: "text",\n        color: "#004a5d",\n        font: {\n          weight: "bold",\n          family: "Noto Sans",\n          size: "12px"\n        }\n      },\n      labelPlacement: "center-center",\n    }]\n  }\n}\n\nfunction resetWordCloud(evt) {\n  if (evt) {\n    allQuestionAnswers = []\n    filterBadWords()\n  } else if (svg) {\n    svg = d3.select("#wordCloudItem").select(\'svg\').remove()\n\n    if ($(window).width() > maxWidth) {\n      width = ($(window).width()*(0.3)) - margin.left - margin.right\n      height = ($(window).height()-50) - margin.top - margin.bottom\n    } else {\n      width = $(window).width() - margin.left - margin.right\n\n      if ($(window).height() <= maxHeight) {\n        height = 100 - margin.top - margin.bottom\n      } else {\n        height = 200 - margin.top - margin.bottom\n      }\n    }\n\n    svg = d3.select("#wordCloudItem").append("svg")\n      .attr("width", width)\n      .attr("height", height)\n    .append("g")\n      .attr("transform",\n            "translate(" + margin.left + "," + margin.top + ")");\n\n    refreshWordCloud(lastQuestionAnswers)\n  }\n}\n\nfunction getSurveyLayer() {\n  if (!surveyLayer) {\n    view.map.layers.forEach(layer => {\n      if (layer.title === surveyLayerName) {\n        surveyLayer = layer;\n      }\n    });\n  }\n\n  return surveyLayer\n}\n\nfunction getBoundariesLayer() {\n  if (!boundariesLayer) {\n    view.map.layers.forEach(layer => {\n      if (layer.title === boundaryLayerName) {\n        boundariesLayer = layer;\n      }\n    });\n  }\n\n  return boundariesLayer\n}\n    \nfunction extentChanged(evt) {\n  if (!debouncing) {\n    debouncing = true;\n    setTimeout(() => {\n      debouncing = false;\n    }, 100);\n\n    const surveyLayer = getSurveyLayer()\n    const surveyQuery = surveyLayer.createQuery();\n    surveyQuery.geometry = view.extent;\n\n    surveyLayer.queryFeatures(surveyQuery).then((results) => {\n      const questionAnswers = results.features.map((feature) => {\n        const questionAnswer = feature.attributes[surveyQuestionField]\n        const lowerCaseQuestionAnswer = questionAnswer.toLowerCase()\n        if (wordDupes.hasOwnProperty(lowerCaseQuestionAnswer) && \n            !wordDupes[lowerCaseQuestionAnswer].includes(questionAnswer)) {\n          wordDupes[lowerCaseQuestionAnswer].push(\'\\\'\' + questionAnswer + \'\\\'\')\n        } else {\n          wordDupes[lowerCaseQuestionAnswer] = [\'\\\'\' + questionAnswer + \'\\\'\']\n        }\n        \n        return lowerCaseQuestionAnswer;\n      });\n\n      const uniqueQuestionAnswers = [...new Set(questionAnswers)]\n\n      if (!arraysEqual(uniqueQuestionAnswers, lastQuestionAnswers)) {\n        refreshWordCloud(uniqueQuestionAnswers);\n      }\n    });\n  }\n}\n    \nfunction refreshWordCloud(questionAnswers) {\n  if (svg) {\n    const fontSize = ($(window).height() <= maxHeight && $(window).width() <= maxWidth) ? 20 : 30\n    layout = d3.layout.cloud()\n      .size([width, height])\n      .words(questionAnswers.map(function(d) { return {text: d}; }))\n      .padding(5)    \n      .rotate(0)    //space between words\n      .fontSize(fontSize)      // font size of words\n      .on("end", draw);\n    layout.start(); \n    \n    lastQuestionAnswers = questionAnswers;\n  }\n}\n\nfunction clickedWord(evt) {\n  currentBoundaries = [];\n\n  closePopup()\n\n  if (currentAnswer && currentAnswer === evt.text) {\n    currentAnswer = null\n  } else {\n    currentAnswer = evt.text\n  }\n\n  refreshWordCloud(lastQuestionAnswers)\n  \n  const surveyLayer = getSurveyLayer()\n  const boundariesLayer = getBoundariesLayer()\n\n  boundariesLayer.definitionExpression = originalBoundariesLayerDefExpr\n\n  if (currentAnswer) {\n    const surveyQuery = surveyLayer.createQuery();\n    const boundariesQuery = boundariesLayer.createQuery();\n    surveyQuery.where = surveyQuestionField + \' IN (\' + wordDupes[currentAnswer].join(\',\') + \')\';\n\n    const multiPointResults = new Multipoint()\n    surveyLayer.queryFeatures(surveyQuery).then((results) => {\n      results.features.forEach((feature) => {\n        multiPointResults.addPoint(feature.geometry)\n      });\n\n      boundariesQuery.geometry = multiPointResults\n      boundariesLayer.queryFeatures(boundariesQuery).then((boundariesResults) => {\n        currentBoundaries = boundariesResults.features\n        filterBoundaries()\n        openCurrentBoundariesPopup()\n      });\n    });\n  }\n}\n\nfunction filterBoundaries() {\n  const boundariesLayer = getBoundariesLayer()\n  let defExpr = null\n  currentBoundaries.forEach((feature) => {\n    if (!defExpr) defExpr = \'\'\n    else defExpr += \' OR \'\n    defExpr += (boundaryNameField + \' = \\\'\' + feature.attributes[boundaryNameField] + \'\\\'\')\n  })\n  boundariesLayer.definitionExpression = \'(\' + originalBoundariesLayerDefExpr + \') AND (\' + defExpr + \')\'\n}\n\nfunction closePopup() {\n  if (view.popup.visible) {\n    closingPopup = true;\n    view.popup.close()\n  }\n}\n\nfunction openCurrentBoundariesPopup() {\n  view.popup.open({\n    features: currentBoundaries,\n    updateLocationEnabled: true\n  })\n}\n\nfunction popupVisibleChanged(visible) {\n  if (!closingPopup && popupHasOpenedOnce && !visible) {\n    clickedWord({text: currentAnswer})\n  } else {\n    closingPopup = false\n    popupHasOpenedOnce = true\n  }\n}\n\nfunction popupFeatureChanged(feature) {\n  const boundariesLayer = getBoundariesLayer()\n  if (feature && feature.layer && feature.layer === boundariesLayer) {\n    const surveyLayer = getSurveyLayer()\n    const surveyQuery = surveyLayer.createQuery();\n    surveyQuery.where = surveyQuestionField + \' IN (\' + wordDupes[currentAnswer].join(\',\') + \')\';\n    surveyQuery.geometry = feature.geometry\n\n    surveyLayer.queryFeatures(surveyQuery).then((results) => {\n      const questionDescriptions = results.features.map((feature) => {\n        return feature.attributes[surveyDescriptionField]\n      });\n\n      setBoundariesPopup(questionDescriptions, feature)\n    });\n  }\n}\n\nfunction setBoundariesPopup(questionDescriptions, boundary) {\n  const boundariesLayer = getBoundariesLayer()\n  if (currentAnswer) {\n    let htmlContent = \'<ul class="list-group" id="wordCloudModalBodyList">\'\n    questionDescriptions.forEach((questionDescription) => {\n      htmlContent += \'<li class ="list-group-item">\' + questionDescription + \'</li>\'\n    });\n    htmlContent += \'</ul>\'\n    const titleModifier = questionDescriptions.length > 0 ? \'feels\' : \'does not feel\'\n    boundariesLayer.popupTemplate = {\n      title: \'{\' + boundaryNameField + \'} \' + titleModifier + \' \' + currentAnswer,\n      content: [\n        {\n          type: "text",\n          text: htmlContent\n        },\n        ...extraBoundaryPopupContent\n      ]\n    }\n  } else {\n    boundariesLayer.popupTemplate = defaultPopupTemplate\n  }\n}\n\n// This function takes the output of \'layout\' above and draw the words\n// Wordcloud features that are THE SAME from one word to the other can be here\nfunction draw(words) {\n  resetPositions = false\n  for(i = 0; i < words.length; i++) {\n    if (!wordLocations.hasOwnProperty(words[i].text)) {\n      wordLocations = {}\n      break\n    }\n  }\n\n  const fontSize = ($(window).height() <= maxHeight && $(window).width() <= maxWidth) ? 20 : 30\n  svg\n    .select("g")\n    .remove()\n  \n  svg\n    .append("g")\n      .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")\n      .selectAll("text")\n        .data(words)\n      .enter().append("text")\n        .style("font-size", fontSize)\n        .style("fill", function (d) { if (d.text === currentAnswer) { return wordCloudSelectedColor } else { return wordCloudColor }})\n        .style("cursor", "pointer")\n        .attr("text-anchor", "middle")\n        .style("font-family", wordCloudFontFamily)\n        .attr("transform", function(d) {\n          if (!wordLocations.hasOwnProperty(d.text)) {\n            wordLocations[d.text] = [d.x, d.y]\n          }\n\n          return "translate(" + wordLocations[d.text] + ")rotate(" + d.rotate + ")";\n        })\n        .text(function(d) { return d.text; }).on("click", clickedWord);\n}\n    \nfunction arraysEqual(arr1, arr2) {\n    if (!Array.isArray(arr1) || ! Array.isArray(arr2) || arr1.length !== arr2.length) {\n      return false;\n    }\n\n    const sortedArr1 = arr1.concat().sort();\n    const sortedArr2 = arr2.concat().sort();\n\n    for (let i = 0; i < sortedArr1.length; i++) {\n      if (sortedArr1[i] !== sortedArr2[i]) {\n        return false;\n      }\n    }\n\n    return true;\n}\n\nfunction fetchBadWords() {\n  return ["4r5e", "5h1t", "5hit", "a55", "anal", "anus", "ar5e", "arrse", "arse", "ass", "ass-fucker", "asses", "assfucker", "assfukka", "asshole", "assholes", "asswhole", "a_s_s", "b!tch", "b00bs", "b17ch", "b1tch", "ballbag", "balls", "ballsack", "bastard", "beastial", "beastiality", "bellend", "bestial", "bestiality", "bi+ch", "biatch", "bitch", "bitcher", "bitchers", "bitches", "bitchin", "bitching", "bloody", "blow job", "blowjob", "blowjobs", "boiolas", "bollock", "bollok", "boner", "boob", "boobs", "booobs", "boooobs", "booooobs", "booooooobs", "breasts", "buceta", "bugger", "bum", "bunny fucker", "butt", "butthole", "buttmuch", "buttplug", "c0ck", "c0cksucker", "carpet muncher", "cawk", "chink", "cipa", "cl1t", "clit", "clitoris", "clits", "cnut", "cock", "cock-sucker", "cockface", "cockhead", "cockmunch", "cockmuncher", "cocks", "cocksuck", "cocksucked", "cocksucker", "cocksucking", "cocksucks", "cocksuka", "cocksukka", "cok", "cokmuncher", "coksucka", "coon", "cox", "crap", "cum", "cummer", "cumming", "cums", "cumshot", "cunilingus", "cunillingus", "cunnilingus", "cunt", "cuntlick", "cuntlicker", "cuntlicking", "cunts", "cyalis", "cyberfuc", "cyberfuck", "cyberfucked", "cyberfucker", "cyberfuckers", "cyberfucking", "d1ck", "damn", "dick", "dickhead", "dildo", "dildos", "dink", "dinks", "dirsa", "dlck", "dog-fucker", "doggin", "dogging", "donkeyribber", "doosh", "duche", "dyke", "ejaculate", "ejaculated", "ejaculates", "ejaculating", "ejaculatings", "ejaculation", "ejakulate", "f u c k", "f u c k e r", "f4nny", "fag", "fagging", "faggitt", "faggot", "faggs", "fagot", "fagots", "fags", "fanny", "fannyflaps", "fannyfucker", "fanyy", "fatass", "fcuk", "fcuker", "fcuking", "feck", "fecker", "felching", "fellate", "fellatio", "fingerfuck", "fingerfucked", "fingerfucker", "fingerfuckers", "fingerfucking", "fingerfucks", "fistfuck", "fistfucked", "fistfucker", "fistfuckers", "fistfucking", "fistfuckings", "fistfucks", "flange", "fook", "fooker", "fuck", "fucka", "fucked", "fucker", "fuckers", "fuckhead", "fuckheads", "fuckin", "fucking", "fuckings", "fuckingshitmotherfucker", "fuckme", "fucks", "fuckwhit", "fuckwit", "fudge packer", "fudgepacker", "fuk", "fuker", "fukker", "fukkin", "fuks", "fukwhit", "fukwit", "fux", "fux0r", "f_u_c_k", "gangbang", "gangbanged", "gangbangs", "gaylord", "gaysex", "goatse", "God", "god-dam", "god-damned", "goddamn", "goddamned", "hardcoresex", "hell", "heshe", "hoar", "hoare", "hoer", "homo", "hore", "horniest", "horny", "hotsex", "jack-off", "jackoff", "jap", "jerk-off", "jism", "jiz", "jizm", "jizz", "kawk", "knob", "knobead", "knobed", "knobend", "knobhead", "knobjocky", "knobjokey", "kock", "kondum", "kondums", "kum", "kummer", "kumming", "kums", "kunilingus", "l3i+ch", "l3itch", "labia", "lust", "lusting", "m0f0", "m0fo", "m45terbate", "ma5terb8", "ma5terbate", "masochist", "master-bate", "masterb8", "masterbat*", "masterbat3", "masterbate", "masterbation", "masterbations", "masturbate", "mo-fo", "mof0", "mofo", "mothafuck", "mothafucka", "mothafuckas", "mothafuckaz", "mothafucked", "mothafucker", "mothafuckers", "mothafuckin", "mothafucking", "mothafuckings", "mothafucks", "mother fucker", "motherfuck", "motherfucked", "motherfucker", "motherfuckers", "motherfuckin", "motherfucking", "motherfuckings", "motherfuckka", "motherfucks", "muff", "mutha", "muthafecker", "muthafuckker", "muther", "mutherfucker", "n1gga", "n1gger", "nazi", "nigg3r", "nigg4h", "nigga", "niggah", "niggas", "niggaz", "nigger", "niggers", "nob", "nob jokey", "nobhead", "nobjocky", "nobjokey", "numbnuts", "nutsack", "orgasim", "orgasims", "orgasm", "orgasms", "p0rn", "pawn", "pecker", "penis", "penisfucker", "phonesex", "phuck", "phuk", "phuked", "phuking", "phukked", "phukking", "phuks", "phuq", "pigfucker", "pimpis", "piss", "pissed", "pisser", "pissers", "pisses", "pissflaps", "pissin", "pissing", "pissoff", "poop", "porn", "porno", "pornography", "pornos", "prick", "pricks", "pron", "pube", "pusse", "pussi", "pussies", "pussy", "pussys", "rectum", "retard", "rimjaw", "rimming", "s hit", "s.o.b.", "sadist", "schlong", "screwing", "scroat", "scrote", "scrotum", "semen", "sex", "sh!+", "sh!t", "sh1t", "shag", "shagger", "shaggin", "shagging", "shemale", "shi+", "shit", "shitdick", "shite", "shited", "shitey", "shitfuck", "shitfull", "shithead", "shiting", "shitings", "shits", "shitted", "shitter", "shitters", "shitting", "shittings", "shitty", "skank", "slut", "sluts", "smegma", "smut", "snatch", "son-of-a-bitch", "spac", "spunk", "s_h_i_t", "t1tt1e5", "t1tties", "teets", "teez", "testical", "testicle", "tit", "titfuck", "tits", "titt", "tittie5", "tittiefucker", "titties", "tittyfuck", "tittywank", "titwank", "tosser", "turd", "tw4t", "twat", "twathead", "twatty", "twunt", "twunter", "v14gra", "v1gra", "vagina", "viagra", "vulva", "w00se", "wang", "wank", "wanker", "wanky", "whoar", "whore", "willies", "willy", "xrated", "xxx"]\n}\n\nfunction fetchDummyWords() {\n  return ["a", "the", "and", "of"]\n}\n    \n});\n  \n<\/script>',a={webMapId:'"820b892cf2b54283bcef1c1c9c635524"',surveyLayerName:'"Race Relations Word Cloud Survey - 2"',surveyQuestionField:'"Question"',surveyDescriptionField:'"describe_why_you_chose_this_wor"',boundaryLayerName:'"USA States (Generalized)"',boundaryNameField:'"STATE_NAME"',extraBoundaryPopupContent:JSON.stringify([{type:"media",mediaInfos:[{title:"Race Distribution",type:"pie-chart",caption:"",value:{fields:["WHITE","BLACK","AMERI_ES","ASIAN","HAWN_PI","HISPANIC","OTHER","MULT_RACE"],normalizeField:null,tooltipField:null}}]}]),wordCloudColor:'"#ebb134"',wordCloudSelectedColor:'"#eb5634"',wordCloudFontFamily:'"Futura"'},o=JSON.parse(JSON.stringify(a));function s(e,n){var t="";return e&&(n&&'""'!==n&&""!==n?(console.log(n),a[e]=n):o.hasOwnProperty("varToReplace")?a[e]=o[e]:delete a[e]),Object.keys(a).forEach((function(e){t+="var ".concat(e," = ").concat(a[e],";")})),r.replace("@@@REPLACEME@@@",t)}},270:function(e,n,t){"use strict";t.r(n);var r,a=t(0),o=t.n(a),s=t(94),i=t.n(s),u=(t(100),t(58)),l=t(5),c=t(9),d=t(12),p=t(21),h=(t(266),t(267),t(268));r=o.a.createRef();var f=JSON.stringify([{type:"media",mediaInfos:[{title:"Race Distribution",type:"pie-chart",caption:"",value:{fields:["WHITE","BLACK","AMERI_ES","ASIAN","HAWN_PI","HISPANIC","OTHER","MULT_RACE"],normalizeField:null,tooltipField:null}}]}]);function m(e){y({target:{id:"wordCloudColor",value:'"'.concat(e.hex,'"')}})}function g(e){y({target:{id:"wordCloudSelectedColor",value:'"'.concat(e.hex,'"')}})}function y(e){e?"extraBoundaryPopupContent"===e.target.id?r.current.value=h.replace(e.target.id,e.target.value):r.current.value=h.replace(e.target.id,'"'.concat(e.target.value,'"')):setTimeout((function(){r.current.value=h.replace()}),500)}var w=function(){return y(null),o.a.createElement(d.a,{className:"App"},o.a.createElement(c.a,{id:"copyableHtmlConfigDiv",sm:"6"},o.a.createElement(l.a,null,o.a.createElement(p.a,null,o.a.createElement(p.a.Item,null,o.a.createElement("h3",null,"Item Id Configuration"),o.a.createElement(l.a.Group,{as:d.a,controlId:"webMapId"},o.a.createElement(l.a.Label,{column:!0,sm:"4"},"Web Map Id"),o.a.createElement(c.a,{sm:"8"},o.a.createElement(l.a.Control,{type:"text",placeholder:"820b892cf2b54283bcef1c1c9c635524",onChange:y}))),o.a.createElement(l.a.Group,{as:d.a,controlId:"appId"},o.a.createElement(l.a.Label,{column:!0,sm:"4"},"App Id (if web map contains secured services)"),o.a.createElement(c.a,{sm:"8"},o.a.createElement(l.a.Control,{type:"text",onChange:y})))),o.a.createElement(p.a.Item,null,o.a.createElement("h3",null,"Survey Layer Configuration"),o.a.createElement(l.a.Group,{as:d.a,controlId:"surveyLayerName"},o.a.createElement(l.a.Label,{column:!0,sm:"4"},"Survey Layer Name"),o.a.createElement(c.a,{sm:"8"},o.a.createElement(l.a.Control,{type:"text",placeholder:"Race Relations Word Cloud Survey - 2",onChange:y}))),o.a.createElement(l.a.Group,{as:d.a,controlId:"surveyQuestionField"},o.a.createElement(l.a.Label,{column:!0,sm:"4"},"Survey Question Field"),o.a.createElement(c.a,{sm:"8"},o.a.createElement(l.a.Control,{type:"text",placeholder:"Question",onChange:y}))),o.a.createElement(l.a.Group,{as:d.a,controlId:"surveyDescriptionField"},o.a.createElement(l.a.Label,{column:!0,sm:"4"},"Survey Description Field"),o.a.createElement(c.a,{sm:"8"},o.a.createElement(l.a.Control,{type:"text",placeholder:"describe_why_you_chose_this_wor",onChange:y})))),o.a.createElement(p.a.Item,null,o.a.createElement("h3",null,"Boundary Layer Configuration"),o.a.createElement(l.a.Group,{as:d.a,controlId:"boundaryLayerName"},o.a.createElement(l.a.Label,{column:!0,sm:"4"},"Boundary Layer Name"),o.a.createElement(c.a,{sm:"8"},o.a.createElement(l.a.Control,{type:"text",placeholder:"USA States (Generalized)",onChange:y}))),o.a.createElement(l.a.Group,{as:d.a,controlId:"boundaryNameField"},o.a.createElement(l.a.Label,{column:!0,sm:"4"},"Boundary Name Field"),o.a.createElement(c.a,{sm:"8"},o.a.createElement(l.a.Control,{type:"text",placeholder:"STATE_NAME",onChange:y}))),o.a.createElement(l.a.Group,{as:d.a,controlId:"extraBoundaryPopupContent"},o.a.createElement(l.a.Label,{column:!0,sm:"4"},"Extra Boundary Popup Content"),o.a.createElement(c.a,{sm:"8"},o.a.createElement(l.a.Control,{as:"textarea",placeholder:f,onChange:y})))),o.a.createElement(p.a.Item,null,o.a.createElement("h3",null,"Word Cloud Configuration"),o.a.createElement(l.a.Group,{as:d.a,controlId:"wordCloudColor"},o.a.createElement(l.a.Label,{column:!0,sm:"4"},"Word Cloud Color"),o.a.createElement(c.a,{sm:"8"},o.a.createElement(u.SketchPicker,{color:"#ebb134",onChangeComplete:m}))),o.a.createElement(l.a.Group,{as:d.a,controlId:"wordCloudSelectedColor"},o.a.createElement(l.a.Label,{column:!0,sm:"4"},"Word Cloud Selected Color"),o.a.createElement(c.a,{sm:"8"},o.a.createElement(u.SketchPicker,{color:"#eb5634",onChangeComplete:g}))),o.a.createElement(l.a.Group,{as:d.a,controlId:"wordCloudFontFamily"},o.a.createElement(l.a.Label,{column:!0,sm:"4"},"Word Cloud Font Family"),o.a.createElement(c.a,{sm:"8"},o.a.createElement(l.a.Control,{type:"text",placeholder:"Futura",onChange:y}))))))),o.a.createElement(c.a,{id:"copyableHtmlDiv",sm:"6"},o.a.createElement(l.a.Group,{controlId:"copyableHtml"},o.a.createElement(l.a.Label,{column:!0,sm:"4"},"Copyable HTML"),o.a.createElement(c.a,{sm:"12"},o.a.createElement(l.a.Control,{as:"textarea",placeholder:h.html,ref:r})))))};Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));i.a.render(o.a.createElement(o.a.StrictMode,null,o.a.createElement(w,null)),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then((function(e){e.unregister()})).catch((function(e){console.error(e.message)}))},95:function(e,n,t){e.exports=t(270)}},[[95,1,2]]]);
//# sourceMappingURL=main.f454d0d9.chunk.js.map