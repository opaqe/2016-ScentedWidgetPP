'use strict';

var ClusterManager = (function () {
    var instance;
    var QUERY_MSG = 'cluster_query';
    var NEW_MSG = 'cluster_new';
    var EDIT_MSG = 'cluster_edit';
    var UNNAMED_PREFIX = '_unnamed';
    var EXCLUDED_URLS = ['newtab/, chrome://newtab/'];
    function init() {
        var clusters = new Map();
        var uname_id = 0;

        function getClusters() {
            return Array.from(clusters.values());
        } 

        function getCombined() {
            var cs = getClusters();
            var c = cs.pop();
            if (cs.length) {
                return c.mergeJSON(cs);
            } else {
                return c.toJSON();
            }
        }

        function mkCluster(name, url) {
            if (!name) {
                name = UNNAMED_PREFIX + uname_id.toString();
                uname_id++;    
            }   
            var cluster = new UserCluster(name, [], null); 
            cluster.addUrl(url);
            clusters.set(name, cluster);
            return cluster;
        }

        function get(name) {
            return clusters.get(name);
        }

        function has(name) {
            return clusters.has(name);
        }

        function addToCluster(name, urls, links, keywords) {
            var c = get(name);
            urls.forEach(function (url) {
                if (EXCLUDED_URLS.includes(url)) return;
                c.addUrl(url);
            });

            links.forEach(function (link) {
                if (EXCLUDED_URLS.includes(link.from) || EXCLUDED_URLS.includes(link.to)) return;
                c.addLink(link.from, link.to);
            });
            keywords.forEach(function (kw) {
                c.addKeyword(kw);
            });
        }

        function editName(old, new_) {
            if (clusters.has(old)) {
                var c = clusters.get(old);
                c.name = new_;
                clusters.set(new_, c);
                clusters.delete(old);
            }
        }

        function getClustersByUrl(url) {
            return getClusters().filter(function (c) {return c.hasUrl(url);});
        }

        // Loads a cluster from json
        function loadJSON(json) {
            var cluster = new UserCluster(json.name, json.keywords, json.graph);
            clusters.set(cluster.name, cluster);
        }

        return {
            UNNAMED_PREFIX: UNNAMED_PREFIX,
            query_message_name: QUERY_MSG,
            new_message_name: NEW_MSG,
            edit_message_name: EDIT_MSG,
            mkCluster: mkCluster,
            addToCluster: addToCluster,
            loadJSON: loadJSON,
            get: get,
            has: has,
            getClusters: getClusters,
            getCombined: getCombined,
            getClustersByUrl: getClustersByUrl,
            editName: editName
        }
    }

    return {
        getInstance: function() {
            if (!instance) {
                instance = init();
            }
            return instance;
        }
    };


})();
