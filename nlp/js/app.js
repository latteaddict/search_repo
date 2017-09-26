// Each time this code is executed, a kitten dies, and I adore kittens!
function clearObject(obj) {
    for (var id in obj) delete obj[id];
}

angular
    .module('AntiGravity', ['ui.bootstrap', 'ngSanitize'])

.factory('appData', ['$http', function($http) {

    data = new Object();
    data.assessor = undefined;

    data.records = {
        'Everything': true
    };
    data.searchResults = {
        'Solr, Default': {
            url: '/search/default',
            enabled: true,
            ok: true,
            response: {
                data: {}
            }
        },
        'Solr, Re-ranking': {
            url: '/search/mobile',
            enabled: false,
            ok: true,
            response: {
                data: {}
            }
        }
        //, 'Gravity':              { url: '/search/gravity', enabled: true,  ok: true, response: {data:{}} }
        //  , 'Combined':             {                         enabled: true,  ok: true, response: {data:{}} }
    };
    data.clearResults = function() {
        angular.forEach(data.searchResults, function(entry) {
            try {
                entry.response.data.model_hash = null
            } catch (e) {}
        });
    };

    data.dbnames = {};
    $http
        .get('data/dbnames.json')
        .success(function(result_data) {
            data.dbnames = result_data;
        });

    data.recordTypeHierarchy = {};
    $http
        .get('/resource/RecordTypeHierarchy')
        .success(function(result_data) {
            data.recordTypeHierarchy = result_data;
        });

    data.opinions = {};
    data.clearOpinions = function() {
        clearObject(data.opinions);
    };

    data.requestCache = {};
    data.clearRequestCache = function() {
        clearObject(data.requestCache);
    };

    data.clearForm = function() {
        data.selfGivenName = '';
        data.selfSurname = '';
        data.selfGender = '';
        data.customFields = [ /*[ 'id', 'Name', 'Value' ]*/ ];
        data.lifeEvents = [ /*[ 'id', 'Type', 'Date', 'Place' ]*/ ];
        data.familyMembers = [ /*[ 'id', 'Relation', 'First Name', 'Last Name' ]*/ ];
        data.unused = {};
        data.clearResults();
        data.clearOpinions();
        data.clearRequestCache();
    };

    var customFieldId = 0;
    data.addCustomField = function() {
        data.customFields.push([++customFieldId, '', '']);
    };
    data.removeCustomField = function(index) {
        data.customFields.splice(index, 1);
    };

    var lifeEventId = 0;
    data.addLifeEvent = function(type) {
        data.lifeEvents.push([++lifeEventId, type, '', '']);
    };
    data.removeLifeEvent = function(index) {
        data.lifeEvents.splice(index, 1);
    };

    var familyMemberId = 0;
    data.addFamilyMember = function(type) {
        data.familyMembers.push([++familyMemberId, type, '', '']);
    };
    data.removeFamilyMember = function(index) {
        data.familyMembers.splice(index, 1);
    };

    function insertData(path, value) {
        if (path[0] == 'Self') {
            if (path[2] == 'GivenName')
                data.selfGivenName = value;
            else if (path[2] == 'Surname')
                data.selfSurname = value;
            else if (path[2] == 'Gender')
                data.selfGender = value;
            else {
                var pos;
                if (path[4] == 'Date') pos = 2;
                else if (path[4] == 'Place') pos = 3;
                else return;
                var ofs = parseInt(path[3]);
                angular.forEach(data.lifeEvents, function(lifeEvent) {
                    if (lifeEvent[1] == path[2]) {
                        ofs -= 1;
                        if (ofs == -1) {
                            lifeEvent[pos] = value;
                            return false;
                        }
                    }
                });
                if (ofs >= 0) {
                    var newLifeEvent = [++lifeEventId, path[2], '', ''];
                    newLifeEvent[pos] = value;
                    data.lifeEvents.push(newLifeEvent);
                }
            }
        } else {
            var pos;
            if (path[2] == 'GivenName') pos = 2;
            else if (path[2] == 'Surname') pos = 3;
            else return;
            var ofs = parseInt(path[1]);
            angular.forEach(data.familyMembers, function(familyMember) {
                if (familyMember[1] == path[0]) {
                    ofs -= 1;
                    if (ofs == -1) {
                        familyMember[pos] = value;
                        return false;
                    }
                }
            });
            if (ofs >= 0) {
                var newFamilyMember = [++familyMemberId, path[0], '', ''];
                newFamilyMember[pos] = value;
                data.familyMembers.push(newFamilyMember);
            }
        }
    }

    function isInt(str) {
        return angular.isNumber(str) || /^\d+$/.test(str);
    }

    function unwindNode(path, value) {
        angular.forEach(value, function(item, index) {
            var path_ = angular.copy(path);
            if (path_.length && !isInt(path_[path_.length - 1]) && !isInt(index))
                path_.push(0);
            path_.push(index);
            if (angular.isObject(item)) unwindNode(path_, item);
            else insertData(path_, item);
        });
    }

    data.loadPersonTreeNode = function(treenode) {
        data.clearForm();
        unwindNode([], treenode)
    };

    function getIndex(type, counters) {
        return type + (-1 + (counters[type] = (counters[type] || 0) + 1));
    }

    data.makeRequest = function(all) {
        var request = {
            //TODO: implement pagination
            start: 0,
            rows: 20
        };

        if (!data.records['Everything']) {
            var records = [];
            angular.forEach(data.records, function(v, k) {
                if (v) records.push(k);
            });
            if (records.length > 0)
                request['RecordType'] = records.join(',');
        }

        if (data.SearchBlock) {
            request['SearchBlock'] = data.SearchBlock;
        }

        if (data.FreeText) {
            request['FreeText'] = data.FreeText;
        }

        var sliderValue = $('#sliderValue').val();
        if (parseInt(sliderValue) > 0) {
            request['Slider'] = sliderValue;
        }

        if (all || !data.unused['SelfGivenName'] && data.selfGivenName)
            request['SelfGivenName'] = data.selfGivenName;
        if (all || !data.unused['SelfSurname'] && data.selfSurname)
            request['SelfSurname'] = data.selfSurname;
        if (data.selfGender)
            request['SelfGender'] = data.selfGender;

        angular.forEach(data.customFields, function(item, index) {
            var model = item[1];
            var value = item[2];
            if (model && value) {
                request['cf:' + (angular.isArray(model) ? model[0] : model)] = value;
            }
        });

        var eventIdx = {};
        angular.forEach(data.lifeEvents, function(item, index) {
            var eventType = item[1];
            var eventDate = item[2];
            var eventPlace = item[3];
            if (eventType) {
                var eventKeyPrefix = 'lifeEvent' + item[0] + '.';
                var fieldNamePrefix = 'Self' + getIndex(eventType, eventIdx);
                if (all || !data.unused[eventKeyPrefix + 'Date'] && eventDate)
                    request[fieldNamePrefix + 'Date'] = eventDate;
                if (all || !data.unused[eventKeyPrefix + 'Place'] && eventPlace)
                    request[fieldNamePrefix + 'Place'] = eventPlace;
            }
        });

        var memberIdx = {};
        angular.forEach(data.familyMembers, function(item, index) {
            var memberType = item[1];
            var memberGivenName = item[2];
            var memberSurname = item[3];
            if (memberType) {
                var memberKeyPrefix = 'familyMember' + item[0] + '.';
                var fieldNamePrefix = getIndex(memberType, memberIdx);
                if (all || !data.unused[memberKeyPrefix + 'GivenName'] && memberGivenName)
                    request[fieldNamePrefix + 'GivenName'] = memberGivenName;
                if (all || !data.unused[memberKeyPrefix + 'Surname'] && memberSurname)
                    request[fieldNamePrefix + 'Surname'] = memberSurname;
            }
        });

        return request;
    };

    data.clearForm();
    return data;
}])

.factory('loginService', ['$q', '$location', '$modal', 'appData', function($q, $location, $modal, appData) {
    var cancelledBefore = false;
    return {
        cancelledBefore: function() {
            return cancelledBefore;
        },
        login: function(source) {
            var modalInstance = $modal.open({
                animation: true,
                templateUrl: 'com/LoginModal.html',
                controller: 'appModal',
                size: 'sm',
                resolve: {
                    source: function() {
                        return source;
                    },
                }
            });
            return modalInstance.result.then(function(assessor) {
                if (assessor && assessor.length > 0) {
                    appData.assessor = assessor;
                    $location.search('assessor', appData.assessor);
                } else {
                    delete appData.assessor;
                }
            }, function() {
                if (source != 'login') {
                    cancelledBefore = true;
                }
            }).catch(function(f) {
                delete appData.assessor;
            });
        },
    };
}])

.directive('appFacetTree', function() {
    return {
        restrict: 'E',
        templateUrl: 'com/FacetTree.html',
        scope: {
            labels: '=labels',
            values: '=values'
        },
        link: function($scope, $element) {
            $scope.isMap = function(x) {
                return angular.isObject(x) && !angular.isArray(x)
            };
            $scope.isList = function(x) {
                return angular.isArray(x)
            };
            $scope.isScalar = function(x) {
                return angular.isString(x) || angular.isNumber(x) || !x
            };

            function refine(node, keys) {
                if ($scope.isMap(node)) {
                    angular.forEach(node, function(subNode, key) {
                        keys.push(key);
                        refine(subNode, keys);
                        keys.pop();
                    });
                } else if ($scope.isScalar(node)) {
                    if ($scope.values[node]) {
                        keys.push(node);
                        angular.forEach(keys, function(key) {
                            if (!$scope.refinedValues[key]) {
                                $scope.refinedValues[key] = 0;
                            }
                            $scope.refinedValues[key] += $scope.values[node];
                        });
                        keys.pop();
                    }
                } else if ($scope.isList(node)) {
                    angular.forEach(node, function(subNode, index) {
                        refine(subNode, keys);
                    });
                }
            }

            $scope.refinedValues = {};
            $scope.$watch(
                'values',
                function(newValues) {
                    clearObject($scope.refinedValues);
                    refine($scope.labels, []);
                    console.log($scope.refinedValues);
                }
            );

            $scope.visible = Object.keys($scope.labels);
        }
    };
})

.directive('appComponent', function() {
    return {
        restrict: 'A',
        templateUrl: function(element, attributes) {
            return 'com/' + attributes.appComponent + '.html';
        }
    };
})

.directive('appOptional', ['appData', function(data) {
    return {
        restrict: 'E',
        transclude: true,
        templateUrl: 'com/OptionalInput.html',
        scope: {},
        link: function(scope, element) {

            scope.interaction = 0;

            function mouseenter(ev) {
                if (scope.interaction == 0) {
                    scope.interaction = 1;
                    scope.$apply();
                }
            }

            function mouseleave(ev) {
                if (scope.interaction == 1) {
                    scope.interaction = 0;
                    scope.$apply();
                }
            }

            function focus(ev) {
                scope.interaction = 2;
                scope.$apply();
            }

            function blur(ev) {
                scope.interaction = 0;
                scope.$apply();
            }

            var tracked = [];
            var _rem = function(e) {
                delete data.unused[e.attr('id')];
            };
            var _add = function(e) {
                data.unused[e.attr('id')] = true;
            };

            scope.beingUsed = function(nVal) {
                if (angular.isDefined(nVal)) {
                    angular.forEach(tracked, nVal ? _rem : _add);
                } else if (tracked.length > 0) {
                    return !data.unused[tracked[0].attr('id')];
                } else {
                    return true;
                }
            };

            element.on('$destroy', function() {
                angular.forEach(tracked, _rem);
            });

            angular.forEach(element.find('input'), function(e) {
                var e = angular.element(e);
                if (e.parent().hasClass('input-group-addon')) {
                    e.parent().on('mouseenter', mouseenter);
                    e.parent().on('mouseleave', mouseleave);
                } else {
                    e.on('mouseenter', mouseenter);
                    e.on('mouseleave', mouseleave);
                    if (e.attr('id')) tracked.push(e);
                }
                e.on('focus', focus);
                e.on('blur', blur);
            });

        }
    };
}])

.controller(
    'appSearchForm', ['appData', '$scope', '$http', '$location', '$interval', 'loginService', '$q',
        function(data, $scope, $http, $location, $interval, loginService, $q) {
            $scope.data = data;

            $scope.recordTypes = [
                'Everything', 'Birth', 'Marriage', 'Residence', 'Death', 'Military', 'Immigration', 'Court', 'Directories',
                'History', 'Maps', 'Reference', 'Newspapers', 'Dossier', 'Photos', 'List', 'Media', 'OCR'
            ];
            $scope.lifeEventTypes = [
                'Birth', 'Marriage', 'Residence', 'Death', 'Arrival'
            ];
            $scope.familyMemberTypes = [
                'Parent', 'Father', 'Mother', 'Spouse', 'Child', 'Sibling'
            ];

            function rightNowPromise(params) {
                return $q(function(resolve) {
                    resolve(params);
                });
            }

            function saveOpinions() {
                var promise = null;
                var results = {};
                var model_hash = null;
                angular.forEach(data.searchResults, function(entry, key) {
                    if (entry.response.data.documents) {
                        results[key] = entry.response.data.documents.map(
                            function(doc) {
                                return doc.data._id_
                            }).join(','); //TODO: remove join
                        if (!model_hash)
                            model_hash = entry.response.data.model_hash;
                    }
                });

                if (model_hash) {
                    if (data.assessor || loginService.cancelledBefore()) {
                        promise = rightNowPromise(data.assessor);
                    } else {
                        promise = loginService.login();
                    }
                    promise.then(function() {
                        if (data.assessor) {
                            $http.post(
                                '/assessment', {
                                    request: data.requestCache[model_hash],
                                    opinions: data.opinions,
                                    search_in: data.records,
                                    /* Might be more than record types in the future */
                                    results: results
                                }, {
                                    params: {
                                        assessor: data.assessor,
                                        model_hash: model_hash
                                    }
                                }
                            );
                        }
                    });
                }
            }

            function loadOpinions(model_hash) {
                if (data.assessor && model_hash)
                    $http
                    .get('/assessment', {
                        params: {
                            assessor: data.assessor,
                            model_hash: model_hash
                        }
                    })
                    .then(function(response) {
                        if (response.data.opinions != null) {
                            data.clearOpinions();
                            angular.forEach(response.data.opinions, function(val, record_id) {
                                data.opinions[record_id] = val;
                            });
                        } else {
                            // no opinions for this particular result set were recorded
                        }
                    });
            }

            $scope.$watch(
                'data.opinions', saveOpinions //TODO: this call may be delayed
                , angular.equals
            );

            $scope.suggestPersonTreeNode = function(query) {
                return $http
                    .get('/treenode', {
                        params: {
                            suggest: query
                        }
                    })
                    .then(function(response) {
                        return response.data.suggestions;
                    });
            };

            $scope.loadPersonTreeNode = function(query) {
                $http
                    .get('/treenode', {
                        params: {
                            lookup: query
                        }
                    })
                    .then(function(response) {
                        data.loadPersonTreeNode(response.data.treenode);
                    });
            };

            $scope.suggestFieldName = function(query) {
                return $http
                    .get('/field', {
                        params: {
                            suggest: query
                        }
                    })
                    .then(function(response) {
                        return response.data.suggestions;
                    });
            };

            function populateCombinedView() {
                var docs = [],
                    seen = {};
                angular.forEach(data.searchResults, function(entry) {
                    if (entry.enabled && entry.url)
                        angular.forEach(entry.response.data.documents, function(doc) {
                            if (!seen[doc.data._id_]) {
                                seen[doc.data._id_] = true;
                                docs.splice(Math.round(Math.random() * docs.length), 0, doc);
                                //NOTE: we're adding documents in random order
                            }
                        });
                });
                data.searchResults.Combined.response = {
                    data: {
                        documents: docs
                    }
                };
            }

            $scope.runSearch = function() {
                var request = data.makeRequest();
                var stStart = Date.now();
                var stResponse = {
                    data: {
                        numFound: '',
                        responsetime: 0.0
                    }
                };

                function hasAllResults() {
                    var count = 0;
                    angular.forEach(data.searchResults, function(entry) {
                        if (entry.response == stResponse)
                            ++count;
                    });
                    return !count;
                }

                //TODO: for whatever reason it doesn't work in Safari, Opera and IE
                var stPromise = $interval(
                    function(step) {
                        var delta = Date.now() - stStart;
                        stResponse.data.numFound = '<'.repeat(1 + Math.floor(delta / 250) % 5);
                        stResponse.data.responsetime = (1e-3 * delta).toFixed(3);
                        if (hasAllResults())
                            $interval.cancel(stPromise);
                    },
                    79.0, 0, true
                );

                var assessorParam = $location.search().assessor || null;

                angular.forEach(data.searchResults, function(entry) {
                    if (!entry.enabled || !entry.url) return;
                    entry.ok = true;
                    entry.response = stResponse;
                    $http
                        .get(entry.url, {
                            params: request
                        })
                        .then(
                            function success(response) {
                                var model_hash = response.data.model_hash;
                                if (data.requestCache[model_hash] == undefined) {
                                    data.requestCache[model_hash] = request;
                                    loadOpinions(model_hash);
                                }
                                angular.forEach(response.data.documents, function(doc) {
                                    try {
                                        doc.data._db_ = data.dbnames[doc.data._id_.split(':')[1]]
                                    } catch (e) {}
                                });
                                entry.response = response;
                                if (hasAllResults())
                                    populateCombinedView();
                            },
                            function failure(response) {
                                entry.ok = false;
                                if (response.status == 0 && response.statusText == '')
                                    response.statusText = 'No reply from the server';
                                entry.response = response;
                            }
                        );
                });
            };
        }
    ])

.controller(
    'appModal', ['appData', '$scope', '$modalInstance', 'source',
        function(data, $scope, $modalInstance, source) {
            $scope.m = {};
            $scope.m['source'] = source || '';
            $scope.m['assessor'] = 'myself';

            $scope.ok = function() {
                console.log('-- ' + $scope.m.assessor);
                $modalInstance.close($scope.m.assessor);
            };

            $scope.cancel = function() {
                $modalInstance.dismiss();
            };
        }
    ])

.directive('appResultView', ['appData', function(data) {
    return {
        restrict: 'A',
        templateUrl: 'com/ResultView.html',
        scope: {
            'current': '=appResultView'
        },
        link: function(scope, element, attributes) {
            scope.recordTypeHierarchy = data.recordTypeHierarchy;
            scope.searchResults = data.searchResults;
            scope.currentResult = data.searchResults[scope.current];
            scope.opn = data.opinions;

            function y(x) {
                if (angular.isArray(x))
                    return x.map(y).reduce(function(p, c) {
                        return p.concat(c)
                    });
                else
                    return [x];
            }
            scope.vector = y;
        }
    };
}])

.controller(
    'appAssessment', ['appData', '$scope', '$location', 'loginService',
        function(data, $scope, $location, loginService) {
            $scope.data = data;
            $scope.panels = Object.keys(data.searchResults).sort();
            $scope.numPanels = 1;
            $scope.showSettings = false;

            $scope.login = function() {
                loginService.login("login").then(function() {});
            };

            $scope.$watch(
                function() {
                    return $location.search().assessor
                },
                function(nVal) {
                    data.assessor = nVal
                }
            );
        }
    ])

.filter('join', function() {
    return function(lst, sep) {
        return lst.filter(function(x) {
            return Boolean(x);
        }).join(sep);
    };
})

.filter('explain', function() {
    /***[ shamelessly taken from Angular's internals ]*****************************/
    /***[ should not be necessary for ver. >= 1.4    ]*****************************/
    function sortedKeys(obj) {
        return Object.keys(obj).sort();
    }

    function forEachSorted(obj, iterator, context) {
        var keys = sortedKeys(obj);
        for (var i = 0; i < keys.length; i++) {
            iterator.call(context, obj[keys[i]], keys[i]);
        }
        return keys;
    }

    function encodeUriQuery(val, pctEncodeSpaces) {
        return encodeURIComponent(val).
        replace(/%40/gi, '@').
        replace(/%3A/gi, ':').
        replace(/%24/g, '$').
        replace(/%2C/gi, ',').
        replace(/%3B/gi, ';').
        replace(/%20/g, (pctEncodeSpaces ? '%20' : '+'));
    }

    function buildUrl(url, params) {
        if (!params) return url;
        var parts = [];
        forEachSorted(params, function(value, key) {
            if (value === null || angular.isUndefined(value)) return;
            if (!angular.isArray(value)) value = [value];
            angular.forEach(value, function(v) {
                if (angular.isObject(v)) {
                    if (angular.isDate(v)) {
                        v = v.toISOString();
                    } else {
                        v = toJson(v);
                    }
                }
                parts.push(encodeUriQuery(key) + '=' + encodeUriQuery(v));
            });
        });
        if (parts.length > 0) {
            url += ((url.indexOf('?') == -1) ? '?' : '&') + parts.join('&');
        }
        return url;
    }
    /******************************************************************************/
    return function(doc, result) {
        try {
            var params = angular.copy(result.response.config.params);
            angular.extend(params, {
                coreName: doc.data._core_[0],
                docId: doc.data._docId_[0],
                plaintext: 'y'
            });
            return buildUrl(result.response.config.url.replace(/^\/search\//, '/explain/'), params);
        } catch (e) {
            return '#';
        }
    };
})

; // the End
