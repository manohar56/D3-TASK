import React, { Component } from "react";
import * as d3 from "d3";
import "./App.css";
import "./d3-context-menu.css";
  
let d3Tree ={}; 
var maxLabelLength = 20; 
var width ,height;
      
var i = 0,duration = 750;
var root;
var svgGroup ; 
var tree; 
var diagonal;
var nodes;
var node , nodeEnter, nodeUpdate , link;
var links, nodeExit;
var selectedNode = null;
var draggingNode = null;
var dragStarted = null; 
var domNode;

function generateUUID(){
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c==='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}
//EXPAND TREE
function expand(d) {
    if (d._children) {
        d.children = d._children;
        d.children.forEach(expand);
        d._children = null;
    }
}
//START CONTEXT MENU HERE
d3.contextMenu = function (menu, openCallback) {

	// create the div element that will hold the context menu
	d3.selectAll('.d3-context-menu').data([1])
		.enter()
		.append('div')
		.attr('class', 'd3-context-menu');

	// close menu
	d3.select('body').on('click.d3-context-menu', function() {
		d3.select('.d3-context-menu').style('display', 'none');
	});
	return function(data, index) {	
		var elm = this;

		d3.selectAll('.d3-context-menu').html('');
		var list = d3.selectAll('.d3-context-menu').append('ul');
		list.selectAll('li').data(menu).enter()
			.append('li')
			.html(function(d) {
				return d.title;
			})
			.on('click', function(d, i) {
				d.action(elm, data, index);
				d3.select('.d3-context-menu').style('display', 'none');
			});

		// the openCallback allows an action to fire before the menu is displayed
		// an example usage would be closing a tooltip
		if (openCallback) openCallback(data, index);

		// display context menu
		d3.select('.d3-context-menu')
			.style('left', (d3.event.pageX - 2) + 'px')
			.style('top', (d3.event.pageY - 2) + 'px')
			.style('display', 'block');

		d3.event.preventDefault();
	};
};
var menu = [];
var nodeName ="";
d3Tree.updateNode = function(state){
    menu = [
        {
                title: 'Rename node',
                action: function(elm, d, i) {
                        console.log('Rename node');
                        state.handleEditModal(d);
                }
        },
        {
                title: 'Delete node',
                action: function(elm, d, i) {
                        console.log("Delete node");
                        deleteNode(d);
                        update(root);
                }
        },
        {
                title: 'Create Node',
                action: function(elm, d, i) {
                        console.log('Create child node');
                        state.handleAddModal(d);
                }
        }
      ];
function deleteNode(d) {
    if(d === root){
        return;
    }else{
        var arr = d.parent.children;
        for(var i= 0; i< arr.length; i++){
            if(arr[i].name===d.name){
            d.parent.children.splice(i,1);
            }
        }
    }
 }

};
//ZOOM START HERE 
function zoom() {
  svgGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}
// zoom listener
var zoomListener = d3.behavior.zoom().scaleExtent([0.1, 3]).on("zoom", zoom);

//UPDATEtEMPcONNECTOR
var updateTempConnector = function() {
  var data = [];
  if (draggingNode !== null && selectedNode !== null) {
      data = [{
          source: {
              x: selectedNode.y0,
              y: selectedNode.x0
          },
          target: {
              x: draggingNode.y0,
              y: draggingNode.x0
          }
      }];
  }
  link = svgGroup.selectAll(".templink").data(data);

  link.enter().append("path")
      .attr("class", "templink")
      .attr("d", d3.svg.diagonal())
      .attr('pointer-events', 'none');

  link.exit().remove();
};

// PAN START HERE

//
function sortTree() {
    tree.sort(function(a, b) {
        return b.name.toLowerCase() < a.name.toLowerCase() ? 1 : -1;
    });
}
//CENTER NODE
function centerNode(source) {
    var scale = zoomListener.scale();
    var x = -source.y0;
    var y = -source.x0;
    x = x * scale + width / 2;
    y = y * scale + height / 2;
    d3.select('g').transition()
        .duration(duration)
        .attr("transform", "translate(" + x + "," + y + ")scale(" + scale + ")");
    zoomListener.scale(scale);
    zoomListener.translate([x, y]);
}
//Drag STARTED
function initiateDrag(d, domNode) {
  draggingNode = d;
  d3.select(domNode).select('.ghostCircle').attr('pointer-events', 'none');
  d3.selectAll('.ghostCircle').attr('class', 'ghostCircle show');
  d3.select(domNode).attr('class', 'node activeDrag');

  svgGroup.selectAll("g.node").sort(function(a, b) { // select the parent and sort the path's
      if (a.id !== draggingNode.id) return 1; // a is not the hovered element, send "a" to the back
      else return -1; // a is the hovered element, bring "a" to the front
  });
  // if nodes has children, remove the links and nodes
  if (nodes.length > 1) {
      // remove link paths
      var links = tree.links(nodes);
      svgGroup.selectAll("path.link")
          .data(links, function(d) {
              return d.target.id;
          }).remove();
      // remove child nodes
      svgGroup.selectAll("g.node")
          .data(nodes, function(d) {
              return d.id;
          }).filter(function(d, i) {
              if (d.id === draggingNode.id) {
                  return false;
              }
              return true;
          }).remove();
  }

  // remove parent link
  tree.links(tree.nodes(draggingNode.parent));
  svgGroup.selectAll('path.link').filter(function(d, i) {
      if (d.target.id === draggingNode.id) {
          return true;
      }
      return false;
  }).remove();

  dragStarted = null;
}
// DRAG LISTNER HERE
var dragListener = d3.behavior.drag()
        .on("dragstart", function(d) {
            if (d === root) {
                return;
            }
            dragStarted = true;
            nodes = tree.nodes(d);
            d3.event.sourceEvent.stopPropagation();})
        .on("drag", function(d) {
            if (d === root) {
                return;
            }
            if (dragStarted) {
                domNode = this;
                initiateDrag(d, domNode);
            }
// get coords of mouseEvent relative to svg container to allow for panni
            d.x0 += d3.event.dy;
            d.y0 += d3.event.dx;
            var node = d3.select(this);
            node.attr("transform", "translate(" + d.y0 + "," + d.x0 + ")");
            updateTempConnector();
        }).on("dragend", function(d) {
            if (d === root) {
                return;
            }
            domNode = this;
            if (selectedNode) {
                // now remove the element from the parent, and insert it into the new elements children
                var index = draggingNode.parent.children.indexOf(draggingNode);
                if (index > -1) {
                    draggingNode.parent.children.splice(index, 1);
                }
                if (typeof selectedNode.children !== 'undefined' || typeof selectedNode._children !== 'undefined') {
                    if (typeof selectedNode.children !== 'undefined') {
                        selectedNode.children.push(draggingNode);
                    } else {
                        selectedNode._children.push(draggingNode);
                    }
                } else {
                    selectedNode.children = [];
                    selectedNode.children.push(draggingNode);
                }
                // Make sure that the node being added to is expanded so user can see added node is correctly moved
                expand(selectedNode);
                sortTree();
                endDrag();
            } else {
                endDrag();
            }
        });
//END DRAG START HERE 
function endDrag() {
  selectedNode = null;
  d3.selectAll('.ghostCircle').attr('class', 'ghostCircle');
  d3.select(domNode).attr('class', 'node');
  // now restore the mouseover event or we won't be able to drag a 2nd time
try {
  d3.select(domNode).select('.ghostCircle').attr('pointer-events', '');
  updateTempConnector();
    if (draggingNode !== null) {
        update(root);
        centerNode(draggingNode);
            draggingNode = null;
        }
    } catch ( Exception ) {
        console.log("CATCH ME HERE");
    }
  
}
function overCircle(d) {
  selectedNode = d;
  console.log("MUKESH");
  updateTempConnector();
}
function outCircle(d) {
  selectedNode = null;
  updateTempConnector();
}

//UPDATE FUNCTION START
function update(source) {
    var levelWidth = [1];
    var viewerWidth = width;
    var childCount = function(level, n) {

        if (n.children && n.children.length > 0) {
            if (levelWidth.length <= level + 1) levelWidth.push(0);

            levelWidth[level + 1] += n.children.length;
            n.children.forEach(function(d) {
                childCount(level + 1, d);
            });
        }
    };
    childCount(0, root);
    var newHeight = d3.max(levelWidth) * 25;  
    tree = tree.size([newHeight, viewerWidth]);

    // Compute the new tree layout.
    nodes = tree.nodes(root).reverse();
        links = tree.links(nodes);
    nodes.forEach(function(d) {
        d.y = (d.depth * (maxLabelLength * 10)); 
    });
node = svgGroup.selectAll("g.node")
        .data(nodes, function(d) {
            return d.id || (d.id = ++i);
        });

    // Enter any new nodes at the parent's previous position.
    nodeEnter = node.enter().append("g")
        .call(dragListener)
        .attr("class", "node")
        .attr("transform", function(d) {
            return "translate(" + source.y0 + "," + source.x0 + ")";
        })
        .on('click', click);

    nodeEnter.append("circle")
        .attr('class', 'nodeCircle')
        .attr("r", 0)
        .style("fill", function(d) {
            return d._children ? "lightsteelblue" : "#fff";
        });

    nodeEnter.append("text")
        .attr("x", function(d) {
            return d.children || d._children ? -10 : 10;
        })
        .attr("dy", ".35em")
        .attr('class', 'nodeText')
        .attr("text-anchor", function(d) {
            return d.children || d._children ? "end" : "start";
        })
        .text(function(d) {
            return d.name;
        })
        .style("fill-opacity", 0);

    // phantom node to give us mouseover in a radius around it
    nodeEnter.append("circle")
        .attr('class', 'ghostCircle')
        .attr("r", 10)
        .attr("opacity", 0.5) // change this to zero to hide the target area
    .style("fill", "red")
        .attr('pointer-events', 'mouseover')
        .on("mouseover", function(d) {
            overCircle(d);
        })
        .on("mouseout", function(d) {
            outCircle(d);
        });

    // Update the text to reflect whether node has children or not.
    node.select('text')
        .attr("x", function(d) {
            return d.children || d._children ? -10 : 10;
        })
        .attr("text-anchor", function(d) {
            return d.children || d._children ? "end" : "start";
        })
        .text(function(d) {
            return d.name;
        });

    // Change the circle fill depending on whether it has children and is collapsed
    node.select("circle.nodeCircle")
        .attr("r", 4.5)
        .style("fill", function(d) {
            return d._children ? "lightsteelblue" : "#fff";
        });

    // Add a context menu
    node.on('contextmenu', d3.contextMenu(menu));


    // Transition nodes to their new position.
    nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function(d) {
            return "translate(" + d.y + "," + d.x + ")";
        });

    // Fade the text in
    nodeUpdate.select("text")
        .style("fill-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function(d) {
            return "translate(" + source.y + "," + source.x + ")";
        })
        .remove();

    nodeExit.select("circle")
        .attr("r", 0);

    nodeExit.select("text")
        .style("fill-opacity", 0);

    // Update the links…
    link = svgGroup.selectAll("path.link")
        .data(links, function(d) {
            return d.target.id;
        });

    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", function(d) {
            var o = {
                x: source.x0,
                y: source.y0
            };
            return diagonal({
                source: o,
                target: o
            });
        });

    // Transition links to their new position.
    link.transition()
        .duration(duration)
        .attr("d", diagonal);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(duration)
        .attr("d", function(d) {
            var o = {
                x: source.x,
                y: source.y
            };
            return diagonal({
                source: o,
                target: o
            });
        })
        .remove();

    // Stash the old positions for transition.
    nodes.forEach(function(d) {
        d.x0 = d.x;
        d.y0 = d.y;
    });
}

//TOGGLE CHILD
function toggleChildren(d) {
    if (d.children) {
        d._children = d.children;
        d.children = null;
    } else if (d._children) {
        d.children = d._children;
        d._children = null;
    }
    return d;
}

// Toggle children on click.

function click(d) {
    if (d3.event.defaultPrevented) return; // click suppressed
    d = toggleChildren(d);
    update(d);
    centerNode(d);
}

d3Tree.showTree=function(props,state){
    const treeData = state.data;
    width= 800;
    height= 400;
    tree = d3.layout.tree()
      .size([height, width]);
diagonal = d3.svg.diagonal()
      .projection(function(d) { return [d.y, d.x]; });
  var  baseSvg = d3.select("#treeWrapper")
      .append("svg")
      .attr("class","overlay")
      .attr("width", props.width)
      .attr("height", props.height)
      .attr("transform", "translate(0,20)")
      .call(zoomListener);

  svgGroup = baseSvg.append("g");

    root = treeData[0];
    root.x0= height/2;
    root.y0 = 0;

    update(root);
    centerNode(root);
    sortTree();
  };
  class Tree extends Component{
      constructor(){
          super();
            this.state= {
            editNode :false,
            addNode : false,
            node : "" ,
            value : ""
            };
        }
          
      handleEditModal =(d)=>{
        this.setState({ editNode : true});
        this.setState({node : d});
    }
    handleAddModal =(d)=>{
        this.setState({ addNode : true});
        this.setState({node : d});
    }
    submitEditnode =()=>{
        nodeName= document.getElementById("txt").value;
        this.state.node.name = nodeName;
        update(this.state.node);
        this.setState({value : "" , editNode : false});
    }
    submitAddnode =()=>{
        if(this.state.node && this.state.addNode){
            if(this.state.node._children !==null){
                this.state.node.children= this.state.node._children;
                this.state.node._children = null;
            }
            if(this.state.node.children === null){
                this.state.node.children = [];
            }
        }
        nodeName = document.getElementById("txt1").value;
        const id = generateUUID();
        this.state.node.children.push({ 'name': nodeName, 
        'id' :  id,
        'depth': this.state.node.depth + 1,                           
        'children': [], 
        '_children':null 
        });
        update(this.state.node);
        this.setState({value : "" , addNode : false});
    }
    closeAddnode =()=>{
        this.setState({value : "" , addNode : false});
    }
    closeEditnode =()=>{
        this.setState({value :"", editNode : false});
    }
    
  componentDidMount(){  
    d3Tree.showTree(
        {
          width: "100%",
          height: "300px"
        },
        this.getChartState()
        );
  }
  componentWillUpdate(){
    d3Tree.updateNode(this.getChartState());
  }
  getChartState(){
    return {
      data : this.props.data,
      handleEditModal:this.handleEditModal,
      handleAddModal : this.handleAddModal
    };
  }
  handleChange=(e)=>{
      this.setState({value : e.target.value});
  }
  render(){
    const addNodeStyle ={
        display: "none", 
        position: "fixed",
        zIndex: 1, 
        paddingTop: "100px", 
        width: "100%",
        top : 0, 
        overflow : "auto",
        height: "100%", 
        backgroundColor: "rgba(0,0,0,0.4)"
        };
    const modalStyle ={
        display: "none", 
        position: "fixed",
        zIndex: 1, 
        paddingTop: "100px", 
        width: "100%",
        top : 0, 
        overflow : "auto",
        height: "100%", 
        backgroundColor: "rgba(0,0,0,0.4)"
        };
    const modalContent ={
        paddingTop : "50px",
        width : "50%",
        height :"50%",
        marginRight : "auto",
        marginLeft : "auto",
        fontSize : "20px",
        textAlign :"center",
        backgroundColor: "pink"
    };
    if(this.state.editNode){
        modalStyle.display = "block";
    }else{ 
        modalStyle.display = "none";
    }
    if(this.state.addNode){
        addNodeStyle.display = "block";
    }else{ 
        addNodeStyle.display = "none";
    }
      return (
          <div>
          < div id="treeWrapper" ></ div> 
          <div style={modalStyle}>
            <div style={modalContent}>
                <h2>Enter Node Name</h2>
                <label>
                    Node Name:<input type="text" id="txt" value={this.state.value}
                    onChange={this.handleChange}/>
                </label><br /><br/>
                <button style={{width:"30%",fontSize:"22px", pointer :"cursor",backgroundColor:"yellow"}} onClick={this.submitEditnode}>Submit</button>
                <button style={{width:"30%", pointer :"cursor",fontSize:"22px",backgroundColor:"wheat"}} onClick={this.closeEditnode}>Close</button>
                </div>
            </div>
            <div style={addNodeStyle}>
                <div style={modalContent}>
                <h2>Add New Node</h2>
                <label>
                    Node Name:<input type="text" id="txt1" value={this.state.value}
                    onChange={this.handleChange}/>
                </label><br /><br/>
                <button style={{width:"30%",fontSize:"22px", pointer :"cursor",backgroundColor:"yellow"}} onClick={this.submitAddnode}>Submit</button>
                <button style={{width:"30%", pointer :"cursor",fontSize:"22px",backgroundColor:"wheat"}} onClick={this.closeAddnode}>Close</button>
                </div>
            </div>
          </div>
      );
  }
}

export default Tree;