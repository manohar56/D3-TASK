import React, { Component } from "react";
import Dtree from "./Dtree";

class App extends Component {
    constructor(props){
        super(props);
        this.state ={
            change : false
        };
    }
    stayTree =()=>{
        if(this.state.change){
            this.setState({ change : false });
        }else{
            this.setState({ change : true});
        }
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
            display : "block" 
        };
        const div1Style = {
            textAlign:"center",
            width : "25%",
            float : "left",
            boxSizing : "border-box"
        };
        const btnStyle = {
            width : "90%",
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
        return(
            <div>
            <div style={div1Style}>
                <button style={btnStyle}onMouseOver={this.showTree}>
                Drop Down</button>
            </div>
            <div onMouseLeave={this.showTree} style={divStyle}>
                <Dtree />
            </div>
            </div>
        );
    }
}
export default App;