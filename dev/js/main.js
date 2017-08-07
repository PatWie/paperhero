
String.prototype.replaceAll_1 = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};


function highlight(term, query) {

    var result = fuzzy_match(query, term);
    result = result[2]

    result = result.replaceAll_1('<b>', '<span class="emph">');
    result = result.replaceAll_1('</b>', '</span>');

    return result

};

MathJax.Hub.Config({
  tex2jax: {
    inlineMath: [['$','$'],['\\(','\\)']],
    processClass: "mathjax",
    ignoreClass: "body"
  }
});
MathJax.Hub.Configured();

var app = angular.module('PaperHeroApp', ['ngSanitize', 'angular.filter',
                'angular-loading-bar', 'ui.codemirror']) // , , 'dropzone'
        .controller('PaperHeroCtrl', ['$scope', '$http',
            function($scope, $http, $sce, $q) {
                // default
                $scope.papers = [];
                $scope.details = [];
                $scope.ids = [];
                $scope.search_scope = 'local';
                $scope.filter_tags = [];
                $scope.right_pane = 'details';
                $scope.show_pdf_name = '';
                $scope.loadingAnimation = false;

                $scope.search = function(s, q){
                    console.log("search");
                    $scope.papers = [];
                    if (typeof s != 'undefined') {
                        $scope.search_scope = s
                    }else{
                        $scope.search_scope = 'local'
                    }
                    url = "/papers/" + $scope.search_scope + "/"
                    if (typeof q != 'undefined') {
                        url = url + q
                    }
                    return $http.get(url)
                    .then(function(papersResponse) {
                        $scope.papers = [];
                        angular.forEach(papersResponse.data, function(k, v) {
                            if($scope.search_scope == 'local'){
                                k['in_lib'] = true;
                            }else{
                                k['in_lib'] = ($scope.ids.indexOf(k.id) != -1);
                            }
                            k['searchable'] = k['title'] + k['authors']
                            $scope.papers.push(k);
                        });
                    });
                }
                $scope.get_ids = function(){
                    return $http.get("/papers/local/").then(function(papersResponse) {
                        $scope.ids = [];
                        angular.forEach(papersResponse.data, function(k, v) {
                            $scope.ids.push(k.id);
                        });
                    });
                }
                $scope.get_ids().then(function(){
                    $scope.search().then(function(){
                        $scope.showPaper($scope.papers[0].id);
                    })
                });

                
  
                // show details
                $scope.showPaper = function(id) {
                    currentIndex = $scope.papers.map(function(d) {return d.id;}).indexOf(id);
                    $scope.details = $scope.papers[currentIndex];
                    $scope.loadMeta();
                    $scope.loadNotes();
                    if($scope.right_pane == "pdf"){
                        $scope.readPaper();
                    }
                    // MathJax.Hub.Queue(["Typeset", MathJax.Hub, document.getElementById('abstract')]);
                };
                // get paper from google
                $scope.retrievePaper = function(query_string) {
                    if(query_string != ""){
                        $scope.search("arxiv", query_string);
                    }
                };
                $scope.setRightPane = function(mode) {
                    $scope.right_pane = mode;
                    if(mode == "pdf"){
                        if($scope.show_pdf_name == ''){
                            $scope.readPaper();
                        }
                        if($scope.show_pdf_name != $scope.details.pdf){
                            $scope.readPaper();
                        }
                    }
                    if(mode == "notes"){
                        $scope.loadNotes();
                    }
                    
                };
                // get paper from google
                $scope.readPaper = function() {
                    node = document.getElementById('pdf_area');
                    if(node.firstChild != null){
                        document.getElementById('pdf_area').removeChild(node.firstChild);
                    }
                    if($scope.show_pdf_name != $scope.details.pdf){
                        $scope.right_pane = 'pdf';
                        $scope.show_pdf_name = $scope.details.pdf;
                        var obj = document.createElement('object');
                        obj.setAttribute('width', '100%');
                        obj.setAttribute('height', '100%');
                        var param = document.createElement('param');
                            param.setAttribute('name', 'Src');
                            param.setAttribute('value', $scope.show_pdf_name)
                        obj.appendChild(param);
                        var embed = document.createElement('embed');
                            embed.setAttribute('width', '100%');
                            embed.setAttribute('height', '100%');
                            embed.setAttribute('src', $scope.show_pdf_name);
                            embed.setAttribute('href', $scope.show_pdf_name);
                        obj.appendChild(embed);
                        // here is where you need to know where you're inserting it
                        // at the end of the body
                        document.body.appendChild(obj);
                        // OR, into a particular div
                        node.appendChild(obj);
                    }
                };
                // download paper from arxiv
                $scope.importPaper = function(id) {
                    $http.get("/fetch/arxiv/" + id).then(function(papersResponse) {
                        id = $scope.papers.map(function(d) {return d.id;}).indexOf(id);
                        $scope.papers[id]['in_lib'] = true;
                    });

                };
                $scope.paperActive = function (title) {
                    return title === $scope.details.title ? 'paper_active' : '';
                };

                $scope.scopeActive = function (title) {
                    return title === $scope.search_scope ? 'active' : '';
                };


                $scope.toogleFilterTag = function(tag){

                    idx = $scope.filter_tags.indexOf(tag)
                    // console.log(idx)
                    // console.log(tag)
                    if (idx > -1){
                        // remove
                        $scope.filter_tags.splice(idx, 1);
                    }else{
                        // add
                        $scope.filter_tags.push(tag)
                    }
                    // console.log($scope.filter_tags)
                }
                $scope.tagClass = function (tags, expected) {
                    if (typeof tags != 'undefined') {
                        return (tags.includes(expected)) ? 'label' + expected : 'label' + expected + ' inactive';
                    }else{
                        return 'label' + expected + ' inactive';
                    }
                };
                $scope.filterTagClass = function (tagId) {
                    return ($scope.filter_tags.indexOf(tagId) > -1) ? "tag_filter" : "";
                };
                $scope.toogleTag = function (tagNr) {
                    if (typeof($scope.details.tags) == 'undefined') {
                        $scope.details.tags = ""
                    }
                    tmp = $scope.details.tags.split(",")
                    index = tmp.indexOf("" + tagNr);
                    if (index > -1){
                        tmp.splice(index, 1);
                        $scope.details.tags = tmp.join();
                    }else{
                        $scope.details.tags = $scope.details.tags + "," + tagNr;
                    }
                    $scope.updateProperty($scope.details.id, 'tags', $scope.details.tags);

                };
                $scope.updateProperty = function(idx, property, newvalue){

                    var dict = {};
                    dict[property] = newvalue;

                    $http({
                        method: 'POST',
                        url: "/property/" + idx,
                        data: dict
                    });
                }

                $scope.hasTag = function (paper, tagNr) {
                    if (typeof(paper) == 'undefined') {
                        return false;
                    }
                    if (typeof(paper.tags) == 'undefined') {
                        return false;
                    }else{
                        tmp = paper.tags.split(",")
                        index = tmp.indexOf(tagNr);
                        return (index > -1);
                    }
                    
                    
                };
                $scope.isValidId = function (arxiv_id) {
                    var re = new RegExp("^([0-9]{4}\.[0-9]{4}v?[0-9]*)$");
                    if (re.test(arxiv_id)) {
                        return true;
                    } else {
                        return false;
                    }
                };

                $scope.genThumb = function () {
                    return $http.get('/thumb/create/' + $scope.details.id).then(function(response) {
                        $scope.details.jpg = response.data['data']
                    });

                };
                $scope.saveNotes = function () {
                    $http({
                        method: 'POST',
                        url: '/text/' + $scope.details.id + ".md",
                        data: $scope.details.notes
                    });
                };
                $scope.loadNotes = function () {
                    return $http.get('/text/' + $scope.details.id + ".md").then(function(response) {
                        $scope.details.notes = response.data['data']
                    });
                };
                $scope.saveMeta = function () {
                    $http({
                        method: 'POST',
                        url: '/text/' + $scope.details.id + ".yml",
                        data: $scope.details.meta
                    });
                };
                $scope.loadMeta = function () {
                    return $http.get('/text/' + $scope.details.id + ".yml").then(function(response) {
                        $scope.details.meta = response.data['data']
                    });
                };




                
            }
        ])


app.filter('emph', function() {
    return function(input, e) {
        if (typeof e == 'undefined') {
            return input
        }else{
            return highlight(input, e); //$scope.query.value
        }
    }
});

var converter = new showdown.Converter();
app.directive("mathjaxBind", function() {
    return {
        restrict: "A",
        controller: ["$scope", "$element", "$attrs", function($scope, $element, $attrs) {
            $scope.$watch($attrs.mathjaxBind, function(value) {
                $element.html(converter.makeHtml(value));
                MathJax.Hub.Queue(["Typeset", MathJax.Hub, $element[0]]);
            });
        }]
    };
});

app.directive('loading', ['$http', function ($http) {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        scope.isLoading = function () {
          return $http.pendingRequests.length > 0;
        };
        scope.$watch(scope.isLoading, function (value) {
          scope.loadingAnimation = value;
        });
      }
    };
}]);

app.filter('filterByTags', function () {
    return function (items, tags) {
        if (!tags || !tags.length) {
          return items;
        }

        var filtered = []; // Put here only items that match
        (items || []).forEach(function (item) { // Check each item
            if (typeof item.tags == 'undefined') {

            }else{

                // console.log("check "+ tags)
                var matches = tags.every(function (tag) {

                     // console.log("text " + tag + " in " + item.tags)
                     return (item.tags.split(",").indexOf("" + tag) > -1);
                });        
                // console.log(matches)
                if (matches) {
                    filtered.push(item);
                }
                // filtered.push(item);
            }
            
        });
        // console.log(filtered)
        return filtered; // Return the array with items that match any tag
        
    };
});

/****************************/
// LICENSE
//
//   This software is dual-licensed to the public domain and under the following
//   license: you are granted a perpetual, irrevocable license to copy, modify,
//   publish, and distribute this file as you see fit.
//
// VERSION 
//   0.1.0  (2016-03-28)  Initial release
//
// AUTHOR
//   Forrest Smith
//


// Returns true if each character in pattern is found sequentially within str
function fuzzy_match_simple(pattern, str) {

    var patternIdx = 0;
    var strIdx = 0;
    var patternLength = pattern.length;
    var strLength = str.length;

    while (patternIdx != patternLength && strIdx != strLength) {
        var patternChar = pattern.charAt(patternIdx).toLowerCase();
        var strChar = str.charAt(strIdx).toLowerCase();
        if (patternChar == strChar)
            ++patternIdx;
        ++strIdx;
    }

    return patternLength != 0 && strLength != 0 && patternIdx == patternLength ? true : false;
}

// Returns [bool, score, formattedStr]
// bool: true if each character in pattern is found sequentially within str
// score: integer; higher is better match. Value has no intrinsic meaning. Range varies with pattern. 
//        Can only compare scores with same search pattern.
// formattedStr: input str with matched characters marked in <b> tags. Delete if unwanted.
function fuzzy_match(pattern, str) {
   
    // Score consts
    var adjacency_bonus = 5;                // bonus for adjacent matches
    var separator_bonus = 10;               // bonus if match occurs after a separator
    var camel_bonus = 10;                   // bonus if match is uppercase and prev is lower
    var leading_letter_penalty = -3;        // penalty applied for every letter in str before the first match
    var max_leading_letter_penalty = -9;    // maximum penalty for leading letters
    var unmatched_letter_penalty = -1;      // penalty for every letter that doesn't matter

    // Loop variables
    var score = 0;
    var patternIdx = 0;
    var patternLength = pattern.length;
    var strIdx = 0;
    var strLength = str.length;
    var prevMatched = false;
    var prevLower = false;
    var prevSeparator = true;       // true so if first letter match gets separator bonus

    // Use "best" matched letter if multiple string letters match the pattern
    var bestLetter = null;
    var bestLower = null;
    var bestLetterIdx = null;
    var bestLetterScore = 0;

    var matchedIndices = [];

    // Loop over strings
    while (strIdx != strLength) {
        var patternChar = patternIdx != patternLength ? pattern.charAt(patternIdx) : null;
        var strChar = str.charAt(strIdx);

        var patternLower = patternChar != null ? patternChar.toLowerCase() : null;
        var strLower = strChar.toLowerCase();
        var strUpper = strChar.toUpperCase();

        var nextMatch = patternChar && patternLower == strLower;
        var rematch = bestLetter && bestLower == strLower;

        var advanced = nextMatch && bestLetter;
        var patternRepeat = bestLetter && patternChar && bestLower == patternLower;
        if (advanced || patternRepeat) {
            score += bestLetterScore;
            matchedIndices.push(bestLetterIdx);
            bestLetter = null;
            bestLower = null;
            bestLetterIdx = null;
            bestLetterScore = 0;
        }

        if (nextMatch || rematch) {
            var newScore = 0;

            // Apply penalty for each letter before the first pattern match
            // Note: std::max because penalties are negative values. So max is smallest penalty.
            if (patternIdx == 0) {
                var penalty = Math.max(strIdx * leading_letter_penalty, max_leading_letter_penalty);
                score += penalty;
            }

            // Apply bonus for consecutive bonuses
            if (prevMatched)
                newScore += adjacency_bonus;

            // Apply bonus for matches after a separator
            if (prevSeparator)
                newScore += separator_bonus;

            // Apply bonus across camel case boundaries. Includes "clever" isLetter check.
            if (prevLower && strChar == strUpper && strLower != strUpper)
                newScore += camel_bonus;

            // Update patter index IFF the next pattern letter was matched
            if (nextMatch)
                ++patternIdx;

            // Update best letter in str which may be for a "next" letter or a "rematch"
            if (newScore >= bestLetterScore) {

                // Apply penalty for now skipped letter
                if (bestLetter != null)
                    score += unmatched_letter_penalty;

                bestLetter = strChar;
                bestLower = bestLetter.toLowerCase();
                bestLetterIdx = strIdx;
                bestLetterScore = newScore;
            }

            prevMatched = true;
        }
        else {
            // Append unmatch characters
            formattedStr += strChar;

            score += unmatched_letter_penalty;
            prevMatched = false;
        }

        // Includes "clever" isLetter check.
        prevLower = strChar == strLower && strLower != strUpper;
        prevSeparator = strChar == '_' || strChar == ' ';

        ++strIdx;
    }

    // Apply score for last match
    if (bestLetter) {
        score += bestLetterScore;
        matchedIndices.push(bestLetterIdx);
    }

    // Finish out formatted string after last pattern matched
    // Build formated string based on matched letters
    var formattedStr = "";
    var lastIdx = 0;
    for (var i = 0; i < matchedIndices.length; ++i) {
        var idx = matchedIndices[i];
        formattedStr += str.substr(lastIdx, idx - lastIdx) + "<b>" + str.charAt(idx) + "</b>";
        lastIdx = idx + 1;
    }
    formattedStr += str.substr(lastIdx, str.length - lastIdx);

    var matched = patternIdx == patternLength;
    return [matched, score, formattedStr];
}


// Strictly optional utility to help make using fts_fuzzy_match easier for large data sets
// Uses setTimeout to process matches before a maximum amount of time before sleeping
//
// To use:
//      var asyncMatcher = new fts_fuzzy_match(fuzzy_match, "fts", "ForrestTheWoods", 
//                                              function(results) { console.log(results); });
//      asyncMatcher.start();
//
function fts_fuzzy_match_async(matchFn, pattern, dataSet, onComplete) {
    var ITEMS_PER_CHECK = 1000;         // performance.now can be very slow depending on platform

    var max_ms_per_frame = 1000.0/30.0; // 30FPS
    var dataIndex = 0;
    var results = [];
    var resumeTimeout = null;

    // Perform matches for at most max_ms
    function step() {
        clearTimeout(resumeTimeout);
        resumeTimeout = null;

        var stopTime = performance.now() + max_ms_per_frame;

        for (; dataIndex < dataSet.length; ++dataIndex) {
            if ((dataIndex % ITEMS_PER_CHECK) == 0) {
                if (performance.now() > stopTime) {
                    resumeTimeout = setTimeout(step, 1);
                    return;
                }
            }

            var str = dataSet[dataIndex];
            var result = matchFn(pattern, str);
            
            // A little gross because fuzzy_match_simple and fuzzy_match return different things
            if (matchFn == fuzzy_match_simple && result == true)
                results.push(str);
            else if (matchFn == fuzzy_match && result[0] == true)
                results.push(result);
        }

        onComplete(results);
        return null;
    };

    // Abort current process
    this.cancel = function() {
        if (resumeTimeout !== null)
            clearTimeout(resumeTimeout);
    };

    // Must be called to start matching.
    // I tried to make asyncMatcher auto-start via "var resumeTimeout = step();" 
    // However setTimout behaving in an unexpected fashion as onComplete insisted on triggering twice.
    this.start = function() {
        step();
    }

    // Process full list. Blocks script execution until complete
    this.flush = function() {
        max_ms_per_frame = Infinity;
        step();
    }
};
/****************************/

app.filter('fuzz', ['$parse', function ( $parse ) {
    return function (collection, property, search, csensitive) {

        if (undefined !== search && search.length > 0) {
            var sorted_collection = [];
             angular.forEach(collection, function(value, key) {
                var result = fuzzy_match(search, value['title']);
                sorted_collection.push({'score': result[1], 'item': value, 'formated': result[2]})
            });

            sorted_collection.sort(function(a,b){
              return a['score'] < b['score'] ? 1 : -1;
            });

            var result_collection = [];
            angular.forEach(sorted_collection, function(value, key) {
                result_collection.push(value['item'])
            });

            return result_collection
        }
        
        return collection;

    }

 }]);
