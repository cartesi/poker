import React, { Component, useState } from 'react';
import './App.css';
import Web3 from 'web3';
// import Game from "./Game.js"
// import { Route , Link,Switch,Redirect } from 'react-router-dom';
import { Button, Card, Form, Input , Icon , Image, Modal, Header} from 'semantic-ui-react'
import Poker from "./Play-Poker-in-India.jpg";
import Zoom from '../abis/Zoom.json';
import TurnBasedGame from "../abis/TurnBasedGame.json";
import Avatar from "./114-1149878_setting-user-avatar-in-specific-size-without-breaking.png"

class App extends Component {

  
 constructor(props) {
    super(props)
    this.state = {
      account: '',
      ethBalance: '0',
      web3:{},
      zoom:{},
      nickname:"",
      erc20:{},
      status:"",
      gamedetails:{},
      metadata:"0x6c00000000000000000000000000000000000000000000000000000000000000",
      showUser: false,
      fund:10,
      owner:"",
      playerfund:"",
      getuserdetails:{},
      user1:"",
      address1:"",
      user2:"",
      address2:""
    }

    
    this.handleSubmit = this.handleSubmit.bind(this);
    //this.handlePlaySubmit = this.handlePlaySubmit.bind(this);

    this.handlePlaySubmit = this.handlePlaySubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);   


  }

  


  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  async loadBlockchainData() {

  }

  async loadWeb3() {



    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
    const web3 = window.web3

    const accounts = await web3.eth.getAccounts()
    this.setState({ account: accounts[0] })
    console.log(this.state.account);
    await this.setState({
      web3:web3
    });

    // Network ID
    const networkId = await web3.eth.net.getId()
    console.log(networkId)

    const ethBalance = await web3.eth.getBalance(this.state.account)
    this.setState({ ethBalance })
    console.log(this.state.ethBalance);

    console.log(Zoom.networks[networkId].address);
    console.log(Zoom.abi);
    
    const zoom = new web3.eth.Contract(Zoom.abi, Zoom.networks["7777"].address);
    this.setState({zoom:zoom});
    console.log(this.state.zoom);

    let temp =  await this.state.zoom.methods.getplayerslength().call({from: this.state.account});
    console.log(temp); 

    if(temp.toNumber() === 0){

 
      let queuedetails =  await this.state.zoom.methods.getGameDetails().call({from: this.state.account});
     
      if(queuedetails.playerFunds.length){
        console.log(queuedetails[0][0][0]);
        console.log(queuedetails[0][0][1])
        await this.setState({
          user1:queuedetails[0][0][0],
          address1:queuedetails[0][0][1],
          user2:"",
          address2:""
        });
      }
  

    }

   
 if(temp.toNumber() == 1) {
  
console.log(
  this.state.err.receipt.logs[0].data
  );
  console.log(TurnBasedGame.abi);
    console.log(TurnBasedGame.abi.filter(o => o.name === 'GameReady')[0]);
    let gameReadyABI = TurnBasedGame.abi.filter(o => o.name === 'GameReady')[0];
    let data = this.state.err.receipt.logs[0].data;
    let index;
    index = this.state.web3.eth.abi.decodeLog(gameReadyABI.inputs, data);
    console.log(index[1]);
    console.log(index[1][1][0]);
    console.log(index[1][1][1]);

    let getuserdetails =  await this.state.zoom.methods.getUserDetailsbyaddress(index[1][1][0]).call({from: this.state.account});
    let getuserdetails1 =  await this.state.zoom.methods.getUserDetailsbyaddress(index[1][1][1]).call({from: this.state.account});
     await this.setState({
      user1:getuserdetails[0],
      address1:getuserdetails[1],
      user2:getuserdetails1[0],
      address2:getuserdetails1[1]
    });
    console.log(getuserdetails1);
    console.log(getuserdetails1[0]);
    console.log(getuserdetails1[1]);


    console.log(getuserdetails);
    console.log(getuserdetails[0]);
    console.log(getuserdetails[1]);


 }

    if(this.state.user1){
      alert("User"+this.state.user1+
      "Address"+this.state.address1+
      "Funds"+this.state.fund+"User"+this.state.user2+
      "Address"+this.state.address2+
      "Funds"+this.state.fund);


      if(this.state.address2){
       this.props.history.push("/game");
      }
    }

    //  console.log(receipt.events.GameWaitArea.returnValues.game.players[0].nickname);

    // let gameReadyABI = TurnBasedGame.abi.filter(o => o.name == 'GameReady')[0];

    // console.log(gameReadyABI);
 


    // const erc20 = new web3.eth.Contract(Erc20,"0xf8e81D47203A594245E36C48e151709F0C19fBe8");
    // this.setState({erc20:erc20});
    // console.log(this.state.erc20); 


 

  
  }


  handleChange (evt) {
    this.setState({ [evt.target.name]: evt.target.value });
  }

  async handleSubmit(){

    this.state.zoom.methods.createUser(
      this.state.nickname, 
    )
    .send({from: this.state.account, gas:500000, gasPrice:10000000000})   
    .then(async (receipt) => {
      console.log(receipt);
     })
    .catch(async (err)=> {
    console.log(err)
    })

    // console.log(this.state.erc20);
    // await this.state.erc20.methods.transfer(this.state.account,10)
    // .send({from: this.state.account, gas:500000, gasPrice:10000000000})   
    // .then(async (receipt) => {
    //   console.log(receipt);
    //  })
    // .catch(async (err)=> {
    // console.log(err)
    // })
}




  async handlePlaySubmit(event){
   
    event.preventDefault();
    
    console.log(this.state.zoom);
    await this.state.zoom.methods.playUser(
      this.state.metadata,
      this.state.fund   
    )
    .send({from: this.state.account, gas:500000, gasPrice:10000000000}) 
    .then(async (receipt) => {
      
      console.log(receipt);
      this.componentWillMount();
      await this.setState({
        receipt:receipt
      });     
    //  console.log(receipt.events.GameWaitArea.returnValues.game.players[0].owner);
})
    .catch(async (err)=> {
    console.log(err)
      
    await this.setState({
      err:err
    });

    this.componentWillMount();
    })


}






render() {
    return (
      <div>
        <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
          
        </nav>
          <div>
             <img src={Poker} style={{width:"100"}}></img>      
                  </div>
                 
                    <div>
                      <Form>
                        <Form.Group widths='equal'>
                          <Form.Field
                            id='form-input-control-email'
                            control={Input}
                            label='Nickname'
                            placeholder='nickname'
                            name="nickname"
                            onChange={this.handleChange}
                          />  
                        </Form.Group>
                      </Form>
                    </div>
                    <Button onClick={this.handleSubmit} basic color='green'>
                        Submit
                      </Button>
                      <Button onClick={this.handlePlaySubmit} basic color='green'>
                        Play now
                  </Button>
              <div>
     </div>
    
  <div>


  <Card>
    <Image src={Avatar} wrapped ui={false} />
    <Card.Content>
    <Card.Header></Card.Header>
      <Card.Meta>
        <span className='date'>{this.state.owner}</span>
      </Card.Meta>
      <Card.Description>
      {this.state.nickname}
      </Card.Description>
    </Card.Content>
    <Card.Content extra>
      <a>
        <Icon name='user' />
        {this.state.playerfund}
      </a>
    </Card.Content>
  </Card>


  <Card>
    <Image src={Avatar} wrapped ui={false} />
    <Card.Content>
    <Card.Header></Card.Header>
      <Card.Meta>
      </Card.Meta>
      <Card.Description>
     </Card.Description>
    </Card.Content>
    <Card.Content extra>
      <a>
        <Icon name='user' />
     </a>
    </Card.Content>
  </Card>
 </div>


</div>
    );
  }
}

export default App;