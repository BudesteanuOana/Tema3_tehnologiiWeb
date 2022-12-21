const express = require('express')
const bodyParser = require('body-parser')
const Sequelize = require('sequelize')

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'my.db'
})

let FoodItem = sequelize.define('foodItem', {
    name : Sequelize.STRING,
    category : {
        type: Sequelize.STRING,
        validate: {
            len: [3, 10]
        },
        allowNull: false
    },
    calories : Sequelize.INTEGER
},{
    timestamps : false
})


const app = express()
// TODO
app.use(bodyParser.json())

app.get('/create', async (req, res) => {
    try{
        await sequelize.sync({force : true})
        for (let i = 0; i < 10; i++){
            let foodItem = new FoodItem({
                name: 'name ' + i,
                category: ['MEAT', 'DAIRY', 'VEGETABLE'][Math.floor(Math.random() * 3)],
                calories : 30 + i
            })
            await foodItem.save()
        }
        res.status(201).json({message : 'created'})
    }
    catch(err){
        console.warn(err.stack)
        res.status(500).json({message : 'server error'})
    }
})

app.get('/food-items', async (req, res) => {
    try{
        let foodItems = await FoodItem.findAll()
        res.status(200).json(foodItems)
    }
    catch(err){
        console.warn(err.stack)
        res.status(500).json({message : 'server error'})        
    }
})

const expectedAttributes = ["name", "category", "calories"]
const expectedCategories = ["MEAT", "DAIRY", "VEGETABLE"]

app.post('/food-items', async (req, res) => {
    try{
        //validate request body existence
        if(Object.keys(req.body).length === 0) {
            res.status(400).json({ message: 'body is missing' })
            return
        }

        //validate request attributes
        if(Object.keys(req.body).length === 3){
            for(const [key, value] of Object.entries(req.body)){
                // first test for expected attributes
                if(!expectedAttributes.includes(key)){
                    res.status(400).json({ message: 'malformed request' })
                    return
                }
                // when we get to category attribute, validate for expected values
                if(key === "category"){
                    if(!expectedCategories.includes(value)){
                        res.status(400).json({ message: 'not a valid category' })
                        return
                    }                
                }
            }
        }else{
            res.status(400).json({ message: 'malformed request' })
            return
        }

        //validate calories field
        if(parseInt(req.body.calories) < 0) {
            res.status(400).json({ message: 'calories should be a positive number' })
            return
        }

        // finaly, save the object
        await FoodItem.create(req.body)
        res.status(201).json({ message: 'created' })
    }
    catch(err){
        console.warn(err.stack)
        res.status(500).json({message: 'server error'})
    }
})

module.exports = app