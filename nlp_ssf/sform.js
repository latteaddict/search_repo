var nextWordGuess = "firstName";
var prevWord = "";
var wordTypesArray = new Array();
var wordSubTypesArray = new Array();
var wordProbabilityArray = new Array();
var totalLastNames = 24212;
var gender = "";
var cWordNumber;
var cWord;
var totalWords;

window.sls.bornMenuItem = '<div id="born" class="menuItem"><span class="itemTitle" shortTitle="born ~">born about</span> <span class="hintType">(year)</span></div>';
window.sls.livedinMenuItem = '<div id="in" class="menuItem"><span class="itemTitle" shortTitle="in">lived in</span> <span class="hintType">(place)</span></div>';
window.sls.fatherMenuItem = '<div id="father" class="stacBtn">father</div>';
window.sls.motherMenuItem = '<div id="mother" class="stacBtn">mother</div>';
window.sls.startingTip = '<span class="tipText">Who are you looking for?</span>';
window.sls.processing = false;
window.sls.totalScore = 0;
sls.triggeredFromLastName = false;

Array.prototype.unique = function() {
    var a = this.concat();
    for (var i = 0; i < a.length; ++i) {
        for (var j = i + 1; j < a.length; ++j) {
            if (a[i] === a[j])
                a.splice(j, 1);
        }
    }
    return a;
};

// google map key: AIzaSyDLuV_NJX8vJMIzf2DJ_n1UYo1J9RVKnp4


function initialize() {
    var input = document.getElementById('searchTextField');
    var optionz = {
        types: ['(regions)']
    };
    autocomplete = new google.maps.places.Autocomplete(input, optionz);
    google.maps.event.addListener(autocomplete, 'place_changed', function() {
        console.log("running maps autocomplete");
        var tempLabel = $("span#input span.sub:last").attr('label');
        var priorText = $("span#input span.sub:last").text();
        var tempText = $("input#searchTextField").val();
        if ($("span#input span.sub:last").hasClass('data')) {
            $("span#input span.sub:last").remove();
        }
        sls.tempString = "<span class='sub data' label='" + tempLabel + "'>" + tempText + "</span>";
        $("span#input").append(sls.tempString);
        scrubInput();
        var e = $.Event("keydown", { keyCode: 32});
        $("span#input").trigger(e);
        $("input#searchTextField").val("").hide();
        $("div#optionsList").show();
        highlightFirst();
        updateList();
        placeCaretAtEnd();
        calculateStrength();
        //console.log(sls.lookupPlaceCode(tempText));
    });
}
google.maps.event.addDomListener(window, 'load', initialize);

function isFirstName(name) {
    name = name.toUpperCase();
    if (jQuery.inArray(name, sls.maleNames) != -1) {
        sls.gender = "male";
        return true;
    } else if (jQuery.inArray(name, sls.femaleNames) != -1) {
        sls.gender = "female";
        return true;
    } else if (jQuery.inArray(name, sls.mixedGenderNames) != -1) {
        sls.gender = "mixed";
        return true;
    } else {
        return false;
    }
}

function isLastName(name) {
    name = name.toUpperCase();
    var start = new Date().getTime();
    name = name.replace(/'/ig, "");
    name = "," + name + ",";
    var indxName = sls.lastNames.indexOf(name);
    if (indxName != -1) {
        //console.log("Yes, "+name+" is "+indxSpot+" on the list.");
        //console.log("Probability of last name ="+(lastNamesArray[indxSpot+1])/totalLastNames+"%");
        //wordTypesArray[cWordNumber-1] = "lastname";
        //var end = new Date().getTime();
        //var time = end - start;
        //console.log('Execution time: ' + time);
        return true;
    } else { //Pick similar names to suggest as matches
        var candidateArray1 = new Array();
        var candidateArray2 = new Array();
        var finalCandidateArray = new Array();
        bitLength = parseInt(name.length / 2);
        if (bitLength > 3) {
            bitLength = 3
        };
        temp = name.substring(0, bitLength);
        insideLength = name.length - bitLength - 1;
        outsideLength = name.length - bitLength + 1;
        evalString = "candidateArray1 = sls.lastNames.match(/," + temp + "[A-Z]{" + insideLength + "," + outsideLength + "},/ig)";
        eval(evalString);
        temp = name.substring(name.length - bitLength, name.length);
        evalString = "candidateArray2 = sls.lastNames.match(/,[A-Z]{" + insideLength + "," + outsideLength + "}" + temp + ",/ig)";
        //console.log(evalString);
        eval(evalString);
        //console.log(candidateArray1);
        //console.log(candidateArray2);
        var candidateArray1 = new Array();
        if (candidateArray1 == null && candidateArray2 != null) {
            candidateArray = candidateArray2;
        } else if (candidateArray2 == null && candidateArray1 != null) {
            candidateArray = candidateArray1;
        } else if (candidateArray1 != null && candidateArray2 != null) {
            var candidateArray = candidateArray1.concat(candidateArray2);
        }
        //console.log(candidateArray);
        for (i = 0; i < candidateArray.length; i++) {
            candidateTemp = candidateArray[i];
            candidateTemp = candidateTemp.replace(/,/ig, "");
            if (candidateTemp.editDistance(name) == 1) {
                finalCandidateArray.push(candidateTemp);
            }
        }
        if (finalCandidateArray.length > 0) {
            finalCandidateArray = finalCandidateArray.unique();
            temp = '"' + name + '" is an unusual last name. Did you happen to mean';
            for (i = 0; i < finalCandidateArray.length; i++) {
                temp = temp + " " + finalCandidateArray[i];
            }
            temp = temp + "?";
            //console.log(temp);
        } else {
            //console.log("No idea about "+name+" as a last name.");
        }
        return false;
    }
    //var end = new Date().getTime();
    //var time = end - start;
    //console.log('Execution time: ' + time);
}

function isRelation(word) {
    switch (word) {
        case "mother":
        case "father":
        case "sibling":
        case "child":
        case "spouse":
            return true;
            break;
        default:
            return false;
    }
}


function isReserved(word) {
    switch (word) {
        case "born":
        case "about":
        case "lived":
        case "mother":
        case "father":
        case "sibling":
        case "siblings":
        case "brother":
        case "sister":
        case "son":
        case "daughter":
        case "child":
        case "children":
        case "spouse":
        case "wife":
        case "husband":
        case "only":
        case "show":
        case "records":
        case "in":
            return true;
            break;
        default:
            return false;
    }
}


/**
 * 18 May 2008
 * Levenshtein distance is a metric for measuring the amount of difference between two sequences.
 *  - http://en.wikipedia.org/wiki/Levenshtein_distance
 *
 * The code has been adapted from the WikiBooks project and is being redistributed
 * under the terms of that license.
 *  - http://en.wikibooks.org/wiki/GNU_Free_Documentation_License
 *  - http://en.wikibooks.org/wiki/Algorithm_implementation/Strings/Levenshtein_distance
 *
 * Please assume any errors found in the below code are translation errors
 * inserted by myself and not those of the original authors.
 *
 * @author Matt Chadburn <matt@commuterjoy.co.uk>
 */

/**
 * @param str {String} The string to be compared with the object's valueOf.
 * @return {Integer} The minimum number of operations needed to transform one string into the other.
 */
String.prototype.editDistance = function(str) {
    if (!str) {
        return false;
    };
    str = str.toLowerCase().replace(/[^a-z]/g, "");
    var t = this.toLowerCase().replace(/[^a-z]/g, "");
    var i;
    var j;
    var cost;
    var d = new Array();
    if (str.length == 0) {
        return str.length;
    };
    if (t.length == 0) {
        return a.length;
    };
    for (i = 0; i <= t.length; i++) {
        d[i] = new Array();
        d[i][0] = i;
    }
    for (j = 0; j <= str.length; j++) {
        d[0][j] = j;
    }
    for (i = 1; i <= t.length; i++) {
        for (j = 1; j <= str.length; j++) {
            if (t.toLowerCase().charAt(i - 1) == str.toLowerCase().charAt(j - 1)) {
                cost = 0;
            } else {
                cost = 1;
            }
            d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        }
    }
    return d[t.length][str.length];
}

function computeGenders() {
    var mixedGenderNames = new Array();
    //console.log((sls.maleNames.length/2)+" male names, " +(sls.femaleNames.length/2)+" female names");
    for (i = (sls.maleNames.length / 2); i > 0; i--) {
        var tempMaleName = sls.maleNames[i * 2];
        var mFreq = sls.maleNames[(i * 2) + 1];
        for (j = (sls.femaleNames.length / 2); j > 0; j--) {
            var tempFemaleName = sls.femaleNames[j * 2];
            var fFreq = sls.femaleNames[(j * 2) + 1];
            if (tempMaleName == tempFemaleName) {
                if (mFreq / fFreq > 25) {
                    //remove from female list
                    //console.log(tempMaleName+" "+sls.maleNames[(i*2)+1]+" vs "+tempFemaleName+" "+sls.femaleNames[(j*2)+1]+" (remove from female list)");
                    sls.femaleNames.splice((j * 2), 2);
                    break;
                } else if (fFreq / mFreq > 25) {
                    //console.log(tempMaleName+" "+sls.maleNames[(i*2)+1]+" vs "+tempFemaleName+" "+sls.femaleNames[(j*2)+1]+" (remove from male list)");
                    sls.maleNames.splice((i * 2), 2);
                    break;
                } else {
                    //console.log(tempMaleName+" "+sls.maleNames[(i*2)+1]+" vs "+tempFemaleName+" "+sls.femaleNames[(j*2)+1]+" (gender indeterminant; remove from both)");
                    mixedGenderNames.push(tempMaleName);
                    break;
                }
            }
        }
    }
    //console.log((sls.maleNames.length/2)+" male names, " +(sls.femaleNames.length/2)+" female names"+mixedGenderNames.length+" mixed names");
    var mixedGenderNameText = '"' + mixedGenderNames[0] + '"';
    for (i = 1; i < (mixedGenderNames.length / 2); i++) {
        mixedGenderNameText = mixedGenderNameText + ', "' + mixedGenderNames[i * 2] + '"';
        //mixedGenderNames.splice(((i*2)+1),1);
    }
    $("body").append("<div id='result' style='width: 750px;'></div>");
    $("#result").text(mixedGenderNameText);
    //console.log(mixedGenderNames);
}

function updateList(el) {
    el = (typeof el === "undefined") ? $("div#optionsList") : el;
    temp = $("span#input");
    el.css('top', (temp.height() + temp.offset().top + 16) + 'px').css('left', (temp.width() + temp.offset().left) + 'px');
}

function placeCaretAtEnd() {
    el = document.getElementById("input");
    el.focus();
    if (typeof window.getSelection != "undefined" &&
        typeof document.createRange != "undefined") {
        var range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    } else if (typeof document.body.createTextRange != "undefined") {
        var textRange = document.body.createTextRange();
        textRange.moveToElementText(el);
        textRange.collapse(false);
        textRange.select();
    }
}

function completeRelation(selectedRelation) { //triggered when hitting enter or clicking on a menuItem
    console.log("completeRelation");
    selectedRelation.parent().hide();
    var subSpans = $("span#input span.sub").detach();
    $("span#input").empty().append(subSpans);
    if ($("span#input span:last").attr('label') == "with") {
        $("span#input span:last").remove();
    }
    var tempType = $(selectedRelation).attr('id');
    $("span#input").append('<span class="sub label relation" label="' + tempType + '">w/' + tempType + ' named</span>');
    scrubInput();
    $("span#input span.sub:last").after("&nbsp;");
    placeCaretAtEnd();
    $("div#relationsList").hide();
    $("div#relationsList div.stacBtn").removeClass('hover').show();
}

function completeItem(selectedItem) { //triggered when hitting enter or clicking on a menuItem
    var tempText = $("span#input").clone().children().remove().end().text().trim();
    if (sls.triggeredFromLastName) {
        sls.triggeredFromLastName = false;
        wrapLast("data", "lastname");
        //} else if (isLastName(tempText) && tempText != "born") {
    } else if (/\d{4}/.test(tempText)) {
        wrapLast("data", "born");
    } else {
        var subSpans = $("span#input span.sub").detach();
        $("span#input").empty().append(subSpans);
    }
    var tempType = $(selectedItem).attr('id');
    $("span#input").append('<span class="sub label" label="' + tempType + '">' + $(selectedItem).find("span.itemTitle").attr('shortTitle') + '</span>');
    scrubInput();
    placeCaretAtEnd();
    if (tempType == "in") {
        var tempX = $("span#input").width() + $("span#input").offset().left + 11;
        var tempY = $("span#input").height() + $("span#input").offset().top - 16;
        $("input#searchTextField").show().css('left', tempX + "px").css('top', tempY + "px").focus();
        if ($("style#temp").length == 0) {
            var tempStyle = '<style type="text/css" id="temp">.pac-item:first-of-type {background-color: #e5f077;}</style>';
            $("head").append(tempStyle);
        }
        sls.disableLocEnter = false;
    } else if (tempType == "with") {
        var tempX = $("span#input").width() + $("span#input").offset().left + 12;
        var tempY = $("span#input").height() + $("span#input").offset().top + 8;
        $("div#relationsList").show().css('left', tempX + "px").css('top', tempY + "px").focus();
        $("div#relationsList div.stacBtn:eq(0)").addClass('hover');
    } else if (tempType == "only") {
        var tempX = $("span#input").width() + $("span#input").offset().left + 12;
        var tempY = $("span#input").height() + $("span#input").offset().top + 6;
        $("div#limitToList").show().css('left', tempX + "px").css('top', tempY + "px").focus();
    }
    $("div#optionsList").hide();
    $("div#optionsList div.menuItem").removeClass('hover').show();
}

function wrapLast(type, name, gender) {
    var totalSpan = $("span#input").text();
    $("span#input > span.sub").each(function(){
        totalSpan = totalSpan.replace($(this).text(),"");
    });
    var leftover = totalSpan.trim();
    if(leftover == ""){
        return false;
    }
    if (typeof type === "undefined") {
        type = "data";
    }
    if (typeof name === "undefined") {
        if ($("span#input span.sub:last").hasClass('relation')) {
            name = $("span#input span.sub:last").attr('label');
        } else {
            if ($("span#input span.sub:last").attr('label') == "firstname") {
                name = "lastname";
            } else {
                name = $("span#input span.sub:last").attr('label');
            }
        }
    }
    gender = (typeof gender === "undefined") ? "" : ' gender="' + gender + '"';
    var relation = "";
    if (isRelation(name)) {
        relation = " relation";
    }
    var tempText = $("span#input").clone().children().remove().end().text().trim();
    if (name == "in") {
        tempText = "in";
    }
    if (tempText != "") {
        //console.log("tempText is blank");
        var subSpans = $("span#input span.sub").detach();
        $("span#input").empty().append(subSpans).append('<span class="sub ' + type + relation + '" label="' + name + '"' + gender + '>' + tempText + '</span>');
        if (name != "firstname" && name != "fi" && name != "middlename" && name != "mi") {
            if (sls.processing == false) {
                updateList();
                $("div#optionsList").show();
                $("div#optionsList div.menuItem").show();
                highlightFirst();
            }
        }
    }
    if (sls.processing == true) {
        $("div#optionsList").hide();
        $("div#relationsList").hide();
        //$("div#searching").show();
        $("span#input").blur();
    }
    scrubInput();
    placeCaretAtEnd();
    calculateStrength();
    if (sls.processing == true) {
        $("span#input").blur();
    }
}

function calculateStrength() {
    var lastnameCount = 0;
    var givennameCount = 0;
    var relationCount = 0;
    $("span#input span.sub.data:not([score])").each(function(i) {
        var type = $(this).attr("label");
        var data = $(this).text().trim();
        var score;
        switch (type) {
            case "firstname":
            case "middlename":
                data = data.toUpperCase();
                if ($(this).attr("gender") == "male") {
                    score = jQuery.inArray(data, sls.maleNames);
                } else if ($(this).attr("gender") == "female") {
                    score = jQuery.inArray(data, sls.femaleNames) / 3.5;
                } else {
                    score = 850;
                }
                if (score < 0 || score > 800) {
                    score = 50;
                } else if (score < 9) {
                    score = 25;
                } else if (score < 40) {
                    score = 30;
                } else if (score < 100) {
                    score = 35;
                } else if (score < 300) {
                    score = 40;
                } else {
                    score = 45;
                }
                givennameCount++;
                score = parseInt(score / givennameCount);
                break;
            case "lastname":
                data = data.toUpperCase();
                data = data.replace(/'/ig, "");
                score = sls.lastNames.indexOf(data);
                if (score < 0 || score > 120000) {
                    score = 60;
                } else if (score < 90) {
                    score = 30;
                } else if (score < 600) {
                    score = 35;
                } else if (score < 1800) {
                    score = 40;
                } else if (score < 4000) {
                    score = 45;
                } else if (score < 20000) {
                    score = 50;
                } else if (score < 60000) {
                    score = 55;
                }
                lastnameCount++;
                score = parseInt(score / lastnameCount);
                break;
            case "born":
                score = 50;
                break;
            case "in": //livedin location
                //ny = 35; states = 50; regular city = 80
                if (data.indexOf("USA") >= 0 || data.indexOf("United States") >= 0) {
                    console.log("us");
                    tempArray = data.split(",");
                    if ((tempArray.length - 1) == 2) {
                        var cityState = (tempArray[0] + "," + tempArray[1]).trim();
                        if (!(sls.cityPop[cityState] === undefined)) {
                            score = parseInt((135 / (sls.cityPop[cityState] + 2)) + 35);
                        } else {
                            score = 80;
                        }
                    } else if ((tempArray.length - 1) == 1) {
                        var state = tempArray[0].trim();
                        if (!(sls.statePop[state] === undefined)) {
                            score = parseInt((135 / (sls.statePop[state] + 2)) + 35);
                        } else {
                            score = 50;
                        }
                    }
                } else {
                    score = 50; //country or outside US
                }
                //console.log("location score=" + score);
                break;
            case "father":
            case "mother":
            case "sibling":
            case "spouse":
            case "child":
                score = 25;
                relationCount++;
                score = parseInt(score / relationCount);
            default:
                //return false;
        }
        $(this).attr("score", score);
    });
    sls.totalScore = 0;
    $("span#input span.sub.data[score]").each(function(i) {
        sls.totalScore += parseInt($(this).attr("score"));
    });
    $("span#strengthScore").text("(" + sls.totalScore + ")");
    var bitsToPaint = parseInt(sls.totalScore / 20);
    var tempDelay = -199;
    $("div.barBit").each(function(index) {
        if (index <= bitsToPaint && !$(this).hasClass('on')) {
            tempDelay = tempDelay + 200;
            var tempArg = "$('div.barBit:eq(" + index + ")').addClass('on');"
            setTimeout(tempArg, tempDelay);
        } else if (index > bitsToPaint && $(this).hasClass('on')) {
            $(this).delay(tempDelay).removeClass('on');
            tempDelay = tempDelay + 200;
        }
    });
    if (sls.totalScore > 20) {
        $("div.strength").css('color', '#888888');
    } else {
        $("div.strength").css('color', '#d4d4d4');
    }
}

function highlightFirst() {
    if ($("div#optionsList div.menuItem:visible").length > 1) {
        $("div#optionsList div.menuItem:visible:eq(0)").addClass('hover');
    }
}

function scrubInput() {
    $("span#input span.sub").each(function(i) {
        if ($(this).text() == " " || $(this).text() == "") {
            if ($(this).hasClass("data")) {
                $(this).prev().remove();
            }
            $(this).remove();
        } else {
            //$(this).text($(this).text().trim())
        }
    });
    $("span#input span.sub:not(:last)").each(function(i) {
        $(this).text($(this).text().replace(/ named/ig, ""));
        //$(this).text($(this).text().replace(/United States/ig, "USA"));
    });
    var subSpans = $("span#input span.sub").detach();
    $("span#input").empty().append(subSpans);
    $("span#input span.sub").after("&nbsp;"); //:not(:last)
    updateListContents();
}

function updateListContents() {
    // Remove items from list if they've already been added to the search string
    //Born about
    if ($("span#input span.sub.data[label='born']").length > 0) {
        if ($("div#optionsList div#born").length == 1) {
            $("div#optionsList div#born").remove();
        }
    } else {
        if ($("div#optionsList div#born").length == 0) {
            if ($("div#optionsList div#lived").length == 1) {
                $("div#optionsList div#lived").after(sls.bornMenuItem);
            } else {
                $("div#optionsList").prepend(sls.bornMenuItem);
            }
        }
    }
    //Lived in
    if ($("span#input span.sub.data[label='in']").length > 0) {
        if ($("div#optionsList div#in").length == 1) {
            $("div#optionsList div#in").remove();
        }
    } else {
        if ($("div#optionsList div#in").length == 0) {
            $("div#optionsList").prepend(sls.livedinMenuItem);
        }
    }
    //Father
    if ($("span#input span.sub.data[label='father']").length > 0) {
        if ($("div#relationsList div#father").length == 1) {
            $("div#relationsList div#father").remove();
        }
    } else {
        if ($("div#relationsList div#father").length == 0) {
            $("div#relationsList div#child").after(sls.fatherMenuItem);
        }
    }
    //Mother
    if ($("span#input span.sub.data[label='mother']").length > 0) {
        if ($("div#relationsList div#mother").length == 1) {
            $("div#relationsList div#mother").remove();
        }
    } else {
        if ($("div#relationsList div#mother").length == 0) {
            $("div#relationsList div#sibling").before(sls.motherMenuItem);
        }
    }
}

$(document).ready(function() {
    $("div#optionsList").hide();
    $("input#searchTextField").val("").hide();
    $("#input").focus();
    sls.menuOptions = [];
    $("div#optionsList div.menuItem span.itemTitle").each(function(i) {
        var tempText = $(this).clone().children().remove().end().text().trim();
        if (tempText.indexOf("/") >= 0) {
            var tempArray = tempText.split("/");
            for (i = 0; i < tempArray.length; i++) {
                sls.menuOptions.push(tempArray[i]);
            }
        } else {
            sls.menuOptions.push(tempText);
        }
    });

    $("#inputOuter").click(function(e) {
        $("#input").focus();
    });
    $("#input").focus().keyup(function(e) {
        updateList();
        var code = (e.keyCode ? e.keyCode : e.which);
        sls.lastKey = code;
        //console.log("code="+code);
        if (code == 32) { //Space bar keycode
            sls.triggeredFromLastName = false;
            $("div#optionsList div.menuItem span.itemTitle").show();
            var cWordNumber = $("span#input span.sub").length + 1;
            var cWord = $(this).clone().children().remove().end().text().trim();
            if (cWordNumber == 1) {
                if (isFirstName(cWord)) { //First name
                    wrapLast("data", "firstname", sls.gender);
                    //$("#genderRadios").show();
                } else if (cWord.length == 1 || cWord.length == 2 && cWord.indexOf(".") != -1) { //First initial
                    wrapLast("data", "fi");
                } else if (isLastName(cWord)) {
                    wrapLast("data", "lastname");
                } else {
                    wrapLast("data", "firstname", sls.gender);
                }
            } else if (cWordNumber > 1) {
                if ($("span#input span.data[label='lastname']").length == 0) {
                    //console.log('route1');
                    var priorWordType = $("span#input span.sub:last").attr('label'); //wordTypesArray[cWordNumber-1];
                    if (isFirstName(cWord) && (priorWordType == "firstname")) { //||  priorWordType == "firstInitial"
                        priorWordGender = $("span#input span.sub:last").attr('gender'); //wordTypesArray[cWordNumber-1];
                        if ((priorWordGender == "male" && sls.gender == "female") || (priorWordGender == "female" && sls.gender == "male")) {
                            wrapLast("data", "lastname", sls.gender);
                        } else { //possible middlename
                            wrapLast("data", "middlename", sls.gender);
                        }
                        //$("#genderRadios").show();
                    } else if (cWord.length == 1 || cWord.length == 2 && cWord.indexOf(".") != -1) { //middle initial
                        wrapLast("data", "mi");
                    } else { //if (isLastName(cWord)) { //last name
                        wrapLast("data", "lastname");
                    }
                } else if (parseInt(cWord) > 1500 && parseInt(cWord) < 2015) { //year
                    //console.log('route2');
                    var priorWordType = $("span#input span.sub:last").attr('label');
                    wrapLast("data", priorWordType);
                } else if ($("span#input span.sub:last").hasClass('relation')) {
                    //console.log('route3');
                    var label = $("span#input span.sub:last").attr('label');
                    wrapLast("data", label);
                    $("div#optionsList").show();
                    $("div#optionsList div.menuItem").removeClass('hover').show();
                    highlightFirst();
                } else if (cWord == "lived" || cWord == "in") {
                    completeItem($("div#optionsList div.menuItem#in"));
                } else if (cWord == "born") {
                    completeItem($("div#optionsList div.menuItem#born"));
                } else if (cWord == "with") {
                    completeItem($("div#optionsList div.menuItem#with"));
                } else if (cWord == "limit") {
                    completeItem($("div#optionsList div.menuItem#only"));
                } else if (isRelation(cWord)) {
                    completeRelation($("div#relationsList div.stacBtn.hover:visible:eq(0)"));
                } else if ($("span#input span.sub:last").hasClass("relation")) {
                    var label = $("span#input span.sub:last").attr('label');
                    wrapLast("data", label);
                } else {
                    //console.log('route5');
                    wrapLast("data", "lastname", sls.gender);
                }
            }
            // Handle last name,(comma) first name?
            //error check for 1 letter edit difference on first names
            //if word is an initial "I" or "L." then mark as first initial
            //check for match as a first name
            //gender check name and set gender
            //if priorWordType =firstName then
            //if word is an intial "I" or "L." then mark as middle initial
            //if match as a last name then
            //if match also scores well as a first name and is gender-matched then mark as middle/last name
            //if scores well as a first name and is not gender-matched then mark as last name
            //if gender is female set secondWord type to maiden name or last name
            // else set to last name (with option for middle name)
            // show place, year, and people options
            //word is a first name then
            //if it might be last name
            //Do something
        } else if (code == 13) { //Enter key
            //e.preventDefault();
            //if	($("div#optionsList div.menuItem:visible").length  == 1) {
            //completeItem($("div#optionsList div.menuItem:visible:eq(0)"));
            //}
        } else if (code == 16) { //Shift key
            //Do nothing
        } else if (code == 9) { //Tab
            //do nothing
        } else if (code == 8) { //Backspace
            //do nothing
            $("span.sub:empty").remove();
            updateListContents();
            if ($("span#input span").length == 0 && $("span#input").text().trim() == "") {
                $("span#input").append(sls.startingTip);
            }
            $("#input").focus();
        } else {
            sls.triggeredFromLastName = false;
            //keyup
            //if space figure out word type
            //if letter and phrase has a last name then determine if match for reserved word
            //--> set highlight on it and enter =
            //if enter(13) and reserved word is triggered then add reserved word
            updateList();
            var tempText = $("#input").text();
            var tempTextArray = tempText.trim().split(" ");
            var tempText = $(this).clone().children().remove().end().text().trim();
            //console.log("partial word = "+tempText);
            /*if(tempText.length == 1) {
            	$("div#optionsList").show();
            	$("div#optionsList div.menuItem").show();
            } else if(tempText.length == 0) {
            	$("div#optionsList").hide();
            	$("div#optionsList div.menuItem").removeClass('hover').show();
            }*/
            if ($("div#relationsList").is(":visible")) {
                $("div#relationsList div.stacBtn").each(function(i) {
                    var tempItem = $(this).text().trim();
                    tempItem = tempItem.toLowerCase();
                    if (tempItem.indexOf(tempText) == 0) {
                        console.log(tempText + " matches " + tempItem);
                        $(this).show();
                        if ($(this).parent().find('.hover').length == 0) {
                            $(this).addClass('hover');
                        }
                    } else {
                        $(this).hide().removeClass('hover');
                    }
                });
            } else {
                if (tempText.length < 5) {
                    if (/\d{4}/.test(tempText)) {
                        $("div#optionsList div.menuItem").show();
                        $("div#optionsList div.menuItem#born").hide();
                        $("div#optionsList").show(); -
                        highlightFirst();
                    } else {
                        //Update optionsList
                        var tempTextArray = tempText.trim().split(" ");
                        $("div#optionsList div.menuItem span.itemTitle").each(function(i) {
                            var tempItem = $(this).text().trim();
                            for (i = 0; i < tempTextArray.length; i++) {
                                if (tempItem.indexOf(tempTextArray[i]) == 0) {
                                    //console.log(tempText+" matches "+ tempItem);
                                    $("div#optionsList").show();
                                    $(this).parent().show();
                                    if ($(this).parent().parent().find('.hover').length == 0) {
                                        $(this).parent().addClass('hover');
                                    }
                                    break;
                                } else {
                                    $(this).parent().hide().removeClass('hover');
                                }
                            }
                        });
                        if ($("div#optionsList div.menuItem:visible").length == 0) {
                            $("div#optionsList").hide();
                            $("div#optionsList div.menuItem").removeClass('hover');
                        } else {
                            $("div#optionsList").show();
                        }
                    }
                } else {
                    if ($("span#input span.sub").length > 0 && isLastName(tempText)) {
                        $("div#optionsList div.menuItem").show();
                        $("div#optionsList").show();
                        sls.triggeredFromLastName = true;
                        //updateList()
                    }
                }
            }
        }
    });

    $("#input").keydown(function(e) {
        //updateList();
        var code = (e.keyCode ? e.keyCode : e.which);
        $("span.tipText").remove();
        //console.log("newkey="+code)
        if (code == 13) { //Enter key
            e.preventDefault();
            if ($("div#optionsList div.menuItem.hover:visible").length == 1) {
                completeItem($("div#optionsList div.menuItem.hover:visible:eq(0)"));
            } else if ($("div#relationsList div.stacBtn.hover:visible").length == 1) {
                completeRelation($("div#relationsList div.stacBtn.hover:visible:eq(0)"));
            } else { //Execute a search
                console.log("processing string");
                processSearchString();
            }
        } else if (code == 38) { // Up arrow
            e.preventDefault();
            if ($("div#optionsList:visible").length == 1) {
                if ($("div#optionsList div.menuItem.hover:visible").length == 1) {
                    if ($("div#optionsList div.menuItem.hover:visible").prev().length == 1) {
                        $("div#optionsList div.menuItem.hover:visible").prev().addClass('hover').next().removeClass('hover');
                    }
                } else if ($("div#optionsList div.menuItem.hover:visible").length == 0) { //if none, highlight 1st
                    $("div#optionsList div.menuItem:visible:last").addClass('hover');
                }
            } else if ($("div#relationsList:visible").length == 1) {
                if ($("div#relationsList div.stacBtn.hover:visible").length == 1) {
                    if ($("div#relationsList div.stacBtn.hover:visible").prev().length == 1) {
                        $("div#relationsList div.stacBtn.hover:visible").prev().addClass('hover').next().removeClass('hover');
                    }
                } else if ($("div#relationsList div.stacBtn.hover:visible").length == 0) { //if none, highlight 1st
                    $("div#relationsList div.stacBtn:visible:last").addClass('hover');
                }
            }
        } else if (code == 40) { // Down arrow
            e.preventDefault();
            if ($("div#optionsList:visible").length == 1) {
                if ($("div#optionsList div.menuItem.hover:visible").length == 1) {
                    if ($("div#optionsList div.menuItem.hover:visible").next().length == 1) {
                        $("div#optionsList div.menuItem.hover:visible").next().addClass('hover').prev().removeClass('hover');
                    }
                } else if ($("div#optionsList div.menuItem.hover:visible").length == 0) { //if none, highlight 1st
                    $("div#optionsList div.menuItem:visible:eq(0)").addClass('hover');
                }
            } else if ($("div#relationsList:visible").length == 1) {
                if ($("div#relationsList div.stacBtn.hover:visible").length == 1) {
                    if ($("div#relationsList div.stacBtn.hover:visible").next().length == 1) {
                        $("div#relationsList div.stacBtn.hover:visible").next().addClass('hover').prev().removeClass('hover');
                    }
                } else if ($("div#relationsList div.stacBtn.hover:visible").length == 0) { //if none, highlight 1st
                    $("div#relationsList div.stacBtn:visible:eq(0)").addClass('hover');
                }
            }
        } else if (code == 9) { // Tab
            e.preventDefault();
            if ($("div#optionsList:visible").length == 1) {
                if ($("div#optionsList div.menuItem.hover:visible").length == 1) {
                    console.log("do me here");
                    completeItem($("div#optionsList div.menuItem.hover:visible:eq(0)"));
                } else if ($("div#optionsList div.menuItem.hover:visible").length == 0) { //if none, highlight 1st
                    $("div#optionsList div.menuItem:visible:eq(0)").addClass('hover');
                }
            } else if ($("div#relationsList:visible").length == 1) {
                if ($("div#relationsList div.stacBtn.hover:visible").length == 1) {
                    completeRelation($("div#relationsList div.stacBtn.hover:visible:eq(0)"));
                } else if ($("div#relationsList div.stacBtn.hover:visible").length == 0) { //if none, highlight 1st
                    $("div#relationsList div.stacBtn:visible:eq(0)").addClass('hover');
                }
            }
        } else if (code == 8) {
            $("div.menu").hide();
        }
        sls.lastKey = code;
    });

    function processSearchString() { //searchText,cursorPos
        $("div#searchBtn").css('background-image', 'url("images/elipsis.png")');
        sls.processing = true;
        wrapLast();
        //pair off reserved words with allowance for edit distance
        sls.searchArgs = "http://search.ancestry.com/cgi-bin/sse.dll?gl=allgs&gss=sfs28_ms_f-2_s&new=1&rank=1&msT=1";
        // First names
        var data = "";
        $("span.sub.data[label='firstname'], span.sub.data[label='middlename'], span.sub.data[label='fi'], span.sub.data[label='mi']").each(function() {
            data += " " + $(this).text();
        });
        sls.searchArgs += "&gsfn=" + data.trim();
        // Last names
        var data = "";
        $("span.sub.data[label='lastname']").each(function() {
            data += " " + $(this).text();
        });
        sls.searchArgs += "&gsln=" + data.trim();
        // everything else
        sls.siblingCount = 0;
        sls.spouseCount = 0;
        sls.childCount = 0;
        $("span.sub.data").each(function() {
            var word = $(this).attr("label");
            var text = $(this).text();
            var data = encodeURIComponent($(this).text());
            //console.log("word="+word);
            switch (word) {
                case "born":
                    sls.searchArgs += "&msbdy=" + data;
                    break;
                case "in": //livedin location
                    var placecode = sls.lookupPlaceCode(text);
                    if(placecode !== 0){
                        sls.searchArgs += "&msypn=" + placecode;
                    }
                    sls.searchArgs += "&msypn__ftp=" + data;
                    break;
                case "father":
                    sls.searchArgs += "&msfng=" + data;
                    break;
                case "mother":
                    sls.searchArgs += "&msmng=" + data;
                    break;
                case "sibling":
                    sls.searchArgs += "&msbng" + sls.siblingCount + "=" + data;
                    sls.siblingCount++;
                    break;
                case "spouse":
                    sls.searchArgs += "&mssng" + sls.spouseCount + "=" + data;
                    sls.spouseCount++;
                    break;
                case "child":
                    sls.searchArgs += "&mscng" + sls.childCount + "=" + data;
                    sls.childCount++;
                    break;
                default:
                    //return false;
            }
        });
        //console.log(sls.searchArgs);
        window.location = sls.searchArgs;
    }
    //$("#firstInput").onfocus?
    //monitor keyboard

    // First word likely a first name (check for initials) Guess gender if a strong first name match
    // Second word as a middle name or last name (if more likely a last name then display verb options)


    // Try to figure out what type of word has just been completed
    //on space or comma process word:
    //Check for 4 digit year => year
    //Check for various date formats 8/1989; 6/9/92; jan 1901; '01; february 15th, 1929; 3 DEC 1905 => year/date
    //Check for reserved place words: 50 states and various countries (full spellings, 2-letter abbr., other abbreviations); countries

    //Dakota Williams born about 1910 in Washington



    //if comma then if prevWord == "firstName" nextWordGuess = "firstName"
    //if "in, around, about, abt, from, moved to, lived in, married in, born in, died in, military service in, arrived from" then assume next entry is a year or place
    ///only show records, only show family trees, only show records from 1850 to 1910, only show records from Kansas and adjacent states, only show records from United States, restrict to, limit to
    /* only show > (record,trees, stories, photos)
    			records from (place)
    			records from (year) to (year)
    			exact matches for (field)


    lived in (place)
    born about (year)
    living with (first names)

    more
    	married
    	died
    	military service
    	immigration (place, year)

    	*/
    //

    //living with + brother, sister, sibling, mother, father, spouse, wife, husband, daughter, son, children + named (optional)

    //if is a first name then separate and add first name moniker and display gender guess
    //if not a first name check most common last names

    $("div#limitToList div#ok").click(function(e) {
        var value = "";
        var tempText = "";
        if ($("div#limitToList input:checked").length > 0) {
            if ($("div#limitToList input:checked").length == 1) {
                value = $("div#limitToList input:checked").val();
                tempText = $("div#limitToList input:checked").attr('id');
            } else {
                $("div#limitToList input:checked:not(:last)").each(function() {
                    value = value + $(this).val();
                    tempText = tempText + $(this).attr('id') + ", ";
                });
                value = value + $("div#limitToList input:checked:last").val();
                tempText = tempText + "and " + $("div#limitToList input:checked:last").attr('id');

            }
            sls.tempString = "<span class='sub data' label='limit' value='" + value + "'>" + tempText + "</span>";
            $("span#input").append(sls.tempString);
        } else { //remove only
            $("span.sub.label[label='only']").remove();
        }
        $("div#limitToList").hide();
    });

    $(".menuItem").click(function(e) {
        sls.lastKey = 1000;
        completeItem($(this));
    });

    $("div#relationsList div.stacBtn").click(function(e) {
        sls.lastKey = 1000;
        completeRelation($(this));
    });

    $(".stacBtn").on("mouseenter", function() {
        $(".stacBtn").removeClass('hover');
        $(this).addClass('hover');
    });

    $(".stacBtn").on("mouseleave", function() {
        $(this).removeClass('hover');
    });

    $(".menuItem").on("mouseenter", function() {
        $(this).children("div.explText").css("color", "#eef1ca");
        if ($(this).hasClass("moreItems") || $(this).hasClass("inv") || $(this).hasClass("toggleOn")) {
            var tempSrc = $(this).children("img").attr("src");
            tempSrc = tempSrc.replace(/.png/g, '-inv.png');
            $(this).children("img").attr("src", tempSrc)
        }
    });

    $(".menuItem").on("mouseleave", function() {
        $(this).children("div.explText").css("color", "#999999");
        if ($(this).hasClass("moreItems") || $(this).hasClass("inv") || $(this).hasClass("toggleOn") || $(this).hasClass("toggleOff")) {
            var tempSrc = $(this).children("img").attr("src");
            tempSrc = tempSrc.replace(/-inv.png/g, '.png');
            $(this).children("img").attr("src", tempSrc)
        }
    });

    $("#trigger").click(function(e) {
        e.preventDefault();
        placeCaretAtEnd();
    });

// On hitting Enter select highlighting item in typeahead list
    $("input#searchTextField").focusin(function() {
        $(document).keypress(function(e) {
            if (e.which == 13) {
                e.preventDefault();
                if (sls.disableLocEnter == false) {
                    var place = $("div.pac-item:eq(0) > span.pac-item-query");
                    if(place.next().text() == ""){
                        var placeText = place.text();
                    } else {
                        var placeText = place.text()+", "+place.next().text();
                    }
                    //console.log("placetext="+placeText);
                    $("span#input span.sub:last").remove();
                    $("span#input").append('<span class="sub data" label="in">'+placeText+'</span>&nbsp;');
                    scrubInput();
                    placeCaretAtEnd();
                    calculateStrength();
                    //console.log(sls.lookupPlaceCode(placeText));
                    /*
                    $("input#searchTextField").simulate('keydown', {
                        keyCode: $.ui.keyCode.DOWN
                    }).simulate('keydown', {
                        keyCode: $.ui.keyCode.UP
                    }).simulate('keydown', {
                        keyCode: $.ui.keyCode.ENTER
                    });
                    */
                }
            } /*else if (e.which == 0) { ///?? Dunno why this is here
                e.preventDefault();
                if (sls.disableLocEnter == false) {
                    $("input#searchTextField").trigger('focus');
                    $("input#searchTextField").simulate('keydown', {
                        keyCode: $.ui.keyCode.DOWN
                    }).simulate('keydown', {
                        keyCode: $.ui.keyCode.UP
                    }).simulate('keydown', {
                        keyCode: $.ui.keyCode.ENTER
                    });
                }
            } */
        });
    });

//If up or down key set disable hitting enter code above, but pass through down arrow
    $("input#searchTextField").keydown(function(e) {
        var code = e.keyCode || e.which;
        if (code == 38 || code == 40) {
            if (sls.disableLocEnter == false) {
                console.log("passing through down arrow");
                sls.disableLocEnter = true;
                if (e.which == 40) {
                    var ekey = $.Event("keydown", { keyCode: 40});
                    $("input#searchTextField").trigger(ekey);
                    /*
                    $("input#searchTextField").simulate('keydown', {
                        keyCode: $.ui.keyCode.DOWN
                    });*/
                }
                $("style#temp").remove();
            }
            sls.disableLocEnter = true;
        }
    });

    $("#searchBtn").click(function(e) {
        processSearchString();
    });

    $("div.page").click(function(e) {
        $("div.menu").hide();
        placeCaretAtEnd();
        //$("div#input").focus();
    });

});
