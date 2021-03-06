'use strict';

// TODO: inherit from BrowsingGraph
function UserCluster(name, keywords, graph, exclusions) {
    this.id = null;
    this.name = name;
    this.keywords = new Set(keywords) || new Set();
    this.graph = new BrowsingGraph();
    this.recentlyAdded = new Set();
    this.exclusions = new Set();
    if (exclusions) {
        exclusions.forEach(function (pat) {
            this.exclusions.add(new RegExp(pat));
        }, this);
    }

    if (graph) {
        graph.nodes.forEach(function (n) {
            this.graph.addNode(n.url);
        }, this);
        graph.links.forEach(function (l) {
            var src = graph.nodes.find(function (n) {
                return n.id == l.source;
            });
            var tgt = graph.nodes.find(function (n) {
                return n.id == l.target;
            });
            if (tgt && src) {
                this.graph.addLink(src.url, tgt.url);
            }
        }, this);
    }

    this.exclude = function (pattern) {
        this.exclusions.add(pattern);
    };

    this.excludes = function (url) {
        return Array.from(this.exclusions).some(function (pat) {
            return url.match(pat);
        });
    };

    this.clearRecentlyAdded = function () {
        this.recentlyAdded = new Set();
    };

    this.getUrls = function () {
        return this.graph.getUrls();
    };

    this.addUrl = function (url) {
        this.graph.addNode(url);
        this.recentlyAdded.add(url);
    };

    this.hasUrl = function (url) {
	    return this.graph.urls.has(url);
    };

    this.removeUrl = function (url) {
        this.graph.removeNode(url);
    };

    this.addLink = function (from, to) {
        this.graph.addLink(from, to);
    };

    this.removeLink = function (from, to) {
        this.graph.removeLink(from, to);
    };

    this.getKeywords = function () {
        var kws = Array.from(this.keywords);
        kws.push(this.name);
        return kws;
    };
    
    this.addKeyword = function (kw) {
        this.keywords.add(kw); 
    };

    this.removeKeywords = function (kws) {
        kws.forEach(function (kw) {
            this.keywords.delete(kw);
        }, this);
    };

    this.toJSON = function () {
        var cluster = this.graph.toJSON();
        cluster.nodes.forEach(function (n) {
            n.cluster = this.name;
            n.recentlyAdded = this.recentlyAdded.has(n.url);
        }, this);
        return {
            id: this.id,
            name: this.name,
            keywords: Array.from(this.keywords),
            graph: cluster,
            exclusions: Array.from(this.exclusions)
        };
    };
    
    // Returns a combined json graph with fields
    // name: joined names of clusters
    // keywords: map of cluster name -> keyword array
    // graph: combined graph object with nodes assigned a group id 
    // clusters: map of group id -> cluster name
    this.mergeJSON = function (clusters) {
        clusters.push(this);
        var names = clusters.map(function(c){return c.name;})
        var name = names.join('-');
        var keywords = {}; 
        clusters.forEach(function (c) {
            c.keywords.forEach(function (k) {
                if (keywords[c.name]) {
                    keywords[c.name].push(k);
                } else {
                    keywords[c.name] = [k];
                }
            });
        });
        clusters.pop();
        var graph = this.graph.mergeJSON(clusters.map(function (c) {return c.graph;}));
        clusters.push(this);
        // Build map for group id to cluster name
        names = new Set(names);
        var groupToCluster = {};
        for (var i = 0; i < graph.nodes.length; i++ ) {
            if (names.size == 0) break;
            var c = clusters.find(function (c) {
                return c.hasUrl(graph.nodes[i].url);
            });
            if (names.has(c.name)) {
                groupToCluster[graph.nodes[i].group] = c.name;
                names.delete(c.name);
            }
        }
        return {name: name, keywords: keywords, graph: graph, clusters: groupToCluster};
    };
}
