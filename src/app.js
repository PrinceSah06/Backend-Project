const express =require('express')

const app =express();

app.get('/',(req,res)=>{
    res.send('hello this is a responce')

})
app.listen(3000,()=>{
console.log('this is listienr http://localhost:3000')
})