import React, { Component } from "react";
import Tree from "./dndtree";
import Treelist from "./Treelist";

class App extends Component {
    constructor(){
        super();
        this.state ={
            treeData :[],
            listData : [],
            change : false,
            name : "Change To Tree",
            isLoading :true
        };
    }
    componentDidMount(){
        fetch("./flare.json")
        .then( resp => {
            return resp.json();
        })
        .then(data =>{
            this.setState({treeData : data , isLoading : false, listData : data});
        });
    }
    showTree =()=>{
        if(this.state.change){
            this.setState({ change : false });
            this.setState({ name :"Change To Tree"});
        }else{
            this.setState({ change : true});
            this.setState({ name :"Change To Directory"});
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
        const listStyle = {
            paddingLeft : "10px",
            backgroundColor : "wheat",
            display : "block"
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
            listStyle.display = "none";
        }else{ 
            divStyle.display = "none";
            listStyle.display = "block";
        }
        if(this.state.isLoading){
            console.log("THIS IS LOADING");
            return <p>Loading..</p>
          }
        return(
            <div>
            <div style={div1Style}>
                <button style={btnStyle}onMouseOver={this.showTree}>
                {this.state.name}</button>
                
            </div>
            <div style={listStyle}>
                <Treelist />
            </div >
            <div style={divStyle}>
                <Tree data={this.state.treeData}/>
            </div>
           </div>
        );
    }
}
export default App;