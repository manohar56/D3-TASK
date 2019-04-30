import React , { Component } from "react";
import * as d3 from "d3";
import "./icon.css";

let D3treelist = {};
d3.layout.treelist = function () {
        "use strict";
        var hierarchy = d3.layout.hierarchy().sort(null).value(null),
            nodeHeight = 20,
            childIndent = 20,
            size;

        var treelist = function (d, i) {
            var nodes = hierarchy.call(this, d, i),
                root = nodes[0];

            function visit(f, t, index, parent) {
                if (t) {
                    f(t, index, parent);
                }
                var children = t.children;
                if (children && children.length) {
                    children.forEach(function (child, ci) {
                        visit(f, child, ci, t);
                    });
                }
            }

            /**
             visit all nodes in the tree and set the x, y positions
            */
            function layout(node) {
                //all children of the same parent are rendered on the same  x level
                //y increases every time a child is added to the list 
                var x = 0, y = 0;
                visit(function (n, index, parent) {
                    x = parent ? parent.x + childIndent : 0;
                    y = y + nodeHeight;
                    n.y = y;
                    n.x = x;

                }, node);
                //update size after visiting
                size = [x, y];
            }

            layout(root);
            return nodes;
        };

        treelist.size = function () {
            return size;
        };

        treelist.nodeHeight = function (d) {
            if (arguments.length) {
                nodeHeight = d;
                return treelist;
            }
            return nodeHeight;
        };

        treelist.childIndent = function (d) {
            if (arguments.length) {
                childIndent = d;
                return treelist;
            }
            return childIndent;
        };

        treelist.nodes = treelist;

        return treelist;
};
d3.json("flare.json", function (err, data) {
    var tree , ul , root;
    var id = 0,duration = 250;

    function toggleChildren(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
    }   else if (d._children) {
            d.children = d._children;
            d._children = null;
        }
        update(d);
    }
    function update(parent) {
        var nodes = tree.nodes(root);
        var nodeEls = ul.selectAll("li").data(nodes, function (d) {
                //d.id = d.id || ++id;
                return d.id ||(d.id = ++id);
            })
            //.attr("position", "absolute")
                //entered nodes
        var entered = nodeEls.enter().append("li")
            .style("top", parent.y +"px")
            .style("opacity", 0)
            .style("height", tree.nodeHeight() + "px")
            .on("click",toggleChildren)
            .on("mouseover", function (d) {
                        d3.select(this)
                        .classed("selected",true);
                    })
            .on("mouseout", function (d) {
                        d3.selectAll(".selected").classed("selected", false);
                    });
                //add arrows if it is a folder
        entered.append("span").attr("class",           function(d) {
             var icon = d.children ? " glyphicon-chevron-down"
                : d._children ? "glyphicon-chevron-right" : "";
                return icon;
                });
                //add text
        entered.append("span").attr("class",        "filename")
                .html(function (d) {
                    return d.name; });
               // .style("background-color","yellow");
                //update caret direction
        nodeEls.select("span").attr("class",            function (d) {
                    var icon = d.children ? " glyphicon-chevron-down"
                        : d._children ? "glyphicon-chevron-right" : "";
                    return icon;
                });
       
                //update position with transition
        nodeEls.transition().duration(duration)
                .style("top", function (d) { 
                return (d.y - tree.nodeHeight()) + "px";})
                .style("left", function (d) { return 5*d.x +"px"; })
                .style("opacity", 1);
                
        nodeEls.exit().remove();
    }

    D3treelist.create= function(){
        tree = d3.layout.treelist()
            .childIndent(10)
            .nodeHeight(30);
        ul = d3.select("#dtree").append("ul");
        root = data[0];
        update(root);
    };
});

class Treelist extends Component {
    constructor(props){
        super(props);
        this.state={
            change : false
        };
    }
    componentDidMount(){
        D3treelist.create();
    }
    render(){
        return(
            <div id="dtree" style ={{height : "400px", backgroundColor : "wheat", overflow: "scroll",position :"relative"}}></div>
        );
    }
}
export default Treelist;