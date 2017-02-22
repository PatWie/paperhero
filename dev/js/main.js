
function highlight(term, query) {
    var termLength = term.length;
    var queryLength = query.length;
    var highlighting = '';
    var ti = 0;
    var previousMatchingCharacter = -2;

    for (var qi = 0; qi < queryLength && ti < termLength; qi++) {
      var qc = query.charAt(qi);
      var lowerQc = qc.toLowerCase();

      for (; ti < termLength; ti++) {
        var tc = term.charAt(ti);

        if (lowerQc === tc.toLowerCase()) {

          highlighting += '<span class="emph">' + tc + '</span>';
          previousMatchingCharacter = ti;
          ti++;
          break;
        } else {
          highlighting += tc;
        }
      }
    }

    highlighting += term.substring(ti, term.length);

    return highlighting
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
                    return $http.get(url).then(function(papersResponse) {
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