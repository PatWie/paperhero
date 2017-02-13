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


var app = angular.module('PaperHeroApp', ['ngSanitize', 'angular.filter', 'angular-loading-bar']) // , , 'dropzone'
        .controller('PaperHeroCtrl', ['$scope', '$http',
            function($scope, $http, $sce, $q) {
                // default
                $scope.papers = [];
                $scope.details = [];
                $scope.ids = [];
                $scope.search_scope = 'local';
                $scope.right_pane = 'details';
                $scope.show_pdf_name = '';

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
                    $http.get(url).then(function(papersResponse) {
                        $scope.papers = [];
                        angular.forEach(papersResponse.data, function(k, v) {
                            if($scope.search_scope == 'local'){
                                k['in_lib'] = true;
                            }else{
                                k['in_lib'] = ($scope.ids.indexOf(k.id) != -1);
                            }
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
                $scope.get_ids().then(function(){$scope.search();});

                
  
                // show details
                $scope.showPaper = function(id) {
                    currentIndex = $scope.papers.map(function(d) {return d.id;}).indexOf(id);
                    $scope.details = $scope.papers[currentIndex];
                    if($scope.right_pane == "pdf"){
                        $scope.readPaper();
                    }
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
                $scope.importPaper = function(arxiv_url) {
                    $http.get("/fetch/arxiv/" + arxiv_url).then(function(papersResponse) {});
                };
                $scope.paperActive = function (title) {
                    return title === $scope.details.title ? 'paper_active' : '';
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

MathJax.Hub.Config({
  tex2jax: {
    inlineMath: [['$','$'],['\\(','\\)']],
    processClass: "mathjax",
    ignoreClass: "body"
  }
});