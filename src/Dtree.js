import React, { Component } from "react";
import Tree from "react-d3-tree";


class Dtree extends Component {
  constructor(props)  {
    super(props);
    this.state = {
      maps: [],
      isLoading :  true
    };
}
    componentDidMount(){
      fetch("./flare.json")
      .then( resp => {
          return resp.json();
      })
      .then(data =>{
          this.setState({maps : data , isLoading : false});
      });
    }
    render(){
      const {maps , isLoading} = this.state;
      if(isLoading){
        console.log("THIS IS LOADING");
        return <p>Loading..</p>
      }
        return(
          <div id="treeWrapper" style={{width: '100%', height: '400px'}}>
                <Tree data={this.state.maps} />
            </div>
        );
    }
}
export default Dtree;