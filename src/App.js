import React, { Component } from "react";
import Tree from "./dndtree";

class App extends Component {
    constructor(){
        super();
        this.state ={
            treeData :[],
            change : false,
            isLoading :true
        };
    }
    componentDidMount(){
        fetch("./flare.json")
        .then( resp => {
            return resp.json();
        })
        .then(data =>{
            this.setState({treeData : data , isLoading : false});
        });
    }
    showTree =()=>{
        if(this.state.change){
            this.setState({ change : false });
        }else{
            this.setState({ change : true});
        }
    }
    render(){
        const divStyle={ 
            padding : "10px",
            display : "block",
        };
        const div1Style = {
            textAlign:"center",
            width : "100%",
            boxSizing : "border-box"
        };
        const btnStyle = {
            width : "30%",
            height:"40px",
            backgroundColor : "lightblue",
            cursor : "pointer",
            margin : "5px"  
        };
        if(this.state.change){
            divStyle.display = "block";
        }else{ 
            divStyle.display = "none";
        }
        if(this.state.isLoading){
            console.log("THIS IS LOADING");
            return <p>Loading..</p>
          }
        return(
            <div>
            <div style={div1Style}>
                <button style={btnStyle}onMouseOver={this.showTree}>
                Drop Down</button>
                
            </div>
            <div style={divStyle}>
            <Tree data={this.state.treeData}/>
            </div>
           </div>
        );
    }
}
export default App;