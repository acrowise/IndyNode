const express = require('express');
const router = new express.Router();
const request = require('request');
const endpoint = require('../controller/endpoint')
const message = require('../controller/message')
const acceptProof = require('../controller/acceptProof')
var CryptoJS = require("crypto-js");
const relationship = require('../controller/relationship')

const acceptOffer = require('../controller/acceptOffer')
const credentialOffer = require('../controller/credentialOffer')
const credentialDefintion= require('../controller/credentialDefintion')
const requetsProof= require('../controller/requestProof')
const schema= require('../controller/schema')
var crypto = require('crypto');
//var fs = require('fs');

var md5sum = crypto.createHash('md5');


let incr = 1;
const createCredential= require('../controller/createCredential')


const connection = require('../controller/connection')
const bodyParser = require("body-parser");


const app = express();

router.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


router.post('/api/schemaCreation',async (req,res)=>{
    try{
        let port = req.body.port
        let tagName= req.body.customerId;
        let names = req.body.attributes;
       let offers = []
       for(let i=0;i<names.length;i++){
            console.log(names[i])
            offers.push( names[i])

        }

        let increment = incr.toString()
        let payload=`{
            "name_of_schema": ${JSON.stringify(tagName)},
            "version": "${increment}.0",
            "attributes": ${JSON.stringify(offers)}
        }`;
        
        incr=incr+1;

        console.log(payload)
        console.log("hii")
      
         let  sechmaInfo = await schema.getschema(port,payload)
         let schemaId=JSON.parse(sechmaInfo).id
        let credPayload=
            `{"schema_id": "${schemaId}",
                "tag": "${tagName}"
                        }`;
        
                        

        let credInfo= await createCredential.getCred(port,credPayload) 

        console.log(credInfo)
        res.send("credential created")
                        
                        
            
        }catch(error){
            res.send("something gone wrong")
        }

        

})

router.post('/api/connection',async (req,res)=>{
    try{

        let flag=0
        let port=req.body.port;
        let fixedport=3001;
        

        let dids= await endpoint.endpointDid(port);
        console.log("sdf"+dids)
        let flags = await connection.sendConReq(dids,fixedport,flag)
        console.log(flags)
        if (flags==1){
            let messages= await message.getMessage(port)
                                let jsMessages=JSON.parse(messages);
                                let messageId=jsMessages[0].id;
                                console.log(messageId)
                                let acceptResponse = await acceptProof.acceptMessage(messageId,port);
                                console.log("proof acepted"+acceptResponse);
                                 messages= await message.getMessage(fixedport)
                                 jsMessages=JSON.parse(messages);
                                 messageId=jsMessages[0].id;
                                 acceptResponse = await acceptProof.acceptMessage(messageId,fixedport);
                                console.log("proof acepted of 3001"+acceptResponse);
                                res.send("connection established with "+port+""+fixedport)
        }
       
        
        
        
                        
                        
                        
                        
                                




                                //res.send("credential defintion created"+innerResult)
                            
                    
                        
        }catch(error){
            res.send("something gone wrong")
        }

        

})



router.post('/api/credentialOffer',async (req,res)=>{

    try{

       let  offers=[];
       let port=req.body.port;
       let fixedport=3001;
       let obj= {};
       let tagName =req.body.tag
       let names = req.body.names;
       let values= req.body.values;
       for(let i=0;i<names.length;i++){
            console.log(names[i])
            offers.push({
                name : names[i],
                value : values[i]
            })

        }
        console.log(typeof(values[3])+""+values[4])
        let appId= crypto.createHash('md5').update(values[3]+values[4]).digest('hex')
        let appIde=CryptoJS.AES.encrypt(values[0], values[4]).toString();

        offers.push({
            name : "appId",
            value : appIde
        })
        console.log(offers)
        let relationshipInfo= await relationship.getRelationship(port)
        relationshipInfo= JSON.parse(relationshipInfo)
        console.log(relationshipInfo[0].their_did)

        let credDef = await credentialDefintion.getcredDef(port,tagName)
        credDef = JSON.parse(credDef)
        console.log(credDef.id)
        let datastring=`{"their_relationship_did":"${relationshipInfo[0].their_did}","cred_def_id":"${credDef.id}","offers": ${JSON.stringify(offers)}}`;

        console.log(datastring)
        let credOffer=await credentialOffer.getcredOffer(port,datastring)

        console.log(credOffer);


        messages= await message.getMessage(fixedport)
        jsMessages=JSON.parse(messages);
        messageId=jsMessages[0].id;
        acceptResponse = await acceptOffer.acceptOffers(messageId,fixedport);

        res.send("credential accepted "+ acceptResponse+ appIde)










    }catch (e){
        res.send("something gone wrong")
    }



})




router.post('/api/requetsProof',async (req,res)=>{
    try{
        let port=req.body.port;
       let fixedport=3001;
       
       let tagName =req.body.tag


        // calling relationShip
        let relationshipInfo= await relationship.getRelationship(port)
        relationshipInfo= JSON.parse(relationshipInfo)
        console.log(relationshipInfo[0].their_did)

        // calling credential by tag
        portcred=req.body.portofcred
        let credDef = await credentialDefintion.getcredDef(portcred,tagName)
        console.log(credDef)
        credDef = JSON.parse(credDef)
        console.log(credDef.id)


        let temp = req.body.listOfAtributes
        let i = 0;
        splitsentence=temp.split(",")
        let dbdata = {"name": `${req.body.transcriptname}`,"version": `${req.body.version}`,"requested_attributes": {"attr1_referent": {"name": "temp","restrictions": [{"cred_def_id": `${credDef.id}`}]}},"requested_predicates": {}}
        for(i=1;i<=splitsentence.length;i++){
            dbdata["requested_attributes"]["attr"+i+"_referent"]={"name":"sepListOfAtributse[0]","restrictions": [{"cred_def_id": `${credDef.id}`}]}
            dbdata["requested_attributes"]["attr"+i+"_referent"]["name"]=splitsentence[i-1]
             }
            console.log(dbdata)

    let datastring=`{"their_relationship_did":"${relationshipInfo[0].their_did}","manual_entry": ${JSON.stringify(dbdata)}}`;

    let requetsProofInfo = await requetsProof.getrequest(port,datastring);

    console.log(requetsProofInfo);

    messages= await message.getMessage(fixedport)
    jsMessages=JSON.parse(messages);
    messageId=jsMessages[0].id;
    acceptResponse = await acceptProof.acceptMessage(messageId,fixedport);
   console.log("proof acepted of 3001"+acceptResponse);


   res.send("request proof accepted")




    }catch(e)
    {
        res.send("something went wrong")
    }
})



router.post('/api/verify',async (req,res)=>{
    try{
        let port=req.body.port;
       //let fixedport=3001;
       
       //let tagName =req.body.tag


        // calling relationShip
        let relationshipInfo= await relationship.getRelationship(port)
        relationshipInfo= JSON.parse(relationshipInfo)
        console.log(relationshipInfo[0].their_did)
        console.log("mac id"+relationshipInfo[0].metadata.macId)
        let macids=relationshipInfo[0].metadata.macId
        let imeis=relationshipInfo[0].metadata.IMEI
        let customerPINs=relationshipInfo[0].metadata.customerPIN
        let userNames=relationshipInfo[0].metadata.userName
        let appIds=relationshipInfo[0].metadata.appId
        console.log(appIds)
        //console.log(req.body.IMEI+req.body.userName)
        // let machid=crypto.createHash('md5').update(req.body.IMEI+req.body.appName).digest('hex')
        // console.log(machid)
        //  machid=crypto.createHash('md5').update(req.body.IMEI+req.body.appName).digest('hex')
        // console.log(machid)  

        // let machid=CryptoJS.AES.encrypt(req.body.IMEI, req.body.userName).toString();
        // console.log(machid)

        console.log(relationshipInfo[0].metadata.customerId)   
            let customerIds=relationshipInfo[0].metadata.customerId;
         for (let i=0;i<relationshipInfo[0].metadata.customerId.length;i++){
             console.log("first")
            if (appIds[i]==req.body.appId){
                console.log("seconde")

                var bytes  = CryptoJS.AES.decrypt(appIds[i],req.body.userName);
                console.log("third")
                var originalText = bytes.toString(CryptoJS.enc.Utf8);
 
                console.log(originalText); // 'my message'
                res.send("customer exist with  customer Id"+originalText )
                
            }
           
         }
         
            res.send("customer doesn't exist")
        





    }catch(e)
    {
        res.send("something went wrong")
    }
})




module.exports = router;