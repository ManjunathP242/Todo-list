const express=require("express");
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
const _=require("lodash");


// let items=[];
// let workItems=[];

const app=express();

app.set('view engine','ejs');

app.use(bodyParser.urlencoded({extended:true}));

app.use(express.static("public"));
mongoose.connect("mongodb://localhost:27017/todolistDB",{useNewUrlParser:true,useUnifiedTopology:true});

const itemsSchema=new mongoose.Schema ({
  name:String
});

const Item=mongoose.model("Item",itemsSchema);
const item1=new Item({name:"Prepare food"});
const item2=new Item({  name:"Eat food"});
const item3=new Item({  name:"Go for a  walk"});

const defaultItems=[item1,item2,item3];

const listSchema= new mongoose.Schema ({
  name:String,
  items:[itemsSchema]
});

const List=mongoose.model("List", listSchema);

app.get("/",function(req,res) {
  Item.find({},function(err,foundItems) {
    var today=new Date();
    var options= {  weekday:"long",  day:"numeric",  month:"long"  };
    const day=today.toLocaleDateString("en-IN",options);

    if(foundItems.length===0) {
      Item.insertMany(defaultItems,function(err) {
        if(err) {
          console.log(err);
        }else {
          console.log("Succesfully saved defaultItems to DB");
        }
      })
      res.redirect("/");
    } else {
      res.render('list', {
        listTitle:"today",
        newListItems:foundItems}
      )
    }
  });
});

  app.get("/:customListName",function(req,res) {

      const customListName=_.capitalize(req.params.customListName);

      List.findOne({name:customListName},function(err,foundList) {
        if(!err) {
          if(!foundList) {
            // console.log("Doesn't exists");
            // create a new list
            const list=new List( {
              name:customListName,
              items:defaultItems
            });
        list.save();
        res.redirect("/"+customListName);
          }
          else {
            // console.log("Exists");
            // show existing list
            res.render("list",{ listTitle:foundList.name,   newListItems:foundList.items  });
          }
        }
      });


  })

app.post("/",function(req,res) {

  const itemName=req.body.newItem;
  const listName=req.body.list;
  const item= new Item({  name:itemName});

  if(listName==="today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name:listName},function(err,foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    })
  }


});



app.post("/delete",function(req,res) {
  const checkedItemId=req.body.checkbox;
  const listName=req.body.listName;

  if(listName==="today") {
    Item.findByIdAndRemove(checkedItemId,function(err) {
      if(!err) {
        console.log("successfully deleted checked item.");
        res.redirect("/");
      }
    })
  } else {
    List.findOneAndUpdate(
      {name:listName},{$pull:{items: {_id:checkedItemId}}},function(err,foundList) {
      if(!err) {
        res.redirect("/"+listName);
      }
    })
  }

})

// app.get("/work",function(req,res) {
//   res.render("list", {
//     listTitle:"Work List",
//     newListItems:workItems
//   })
// });

app.get("/about",function(req,res) {
  res.render("about");
});

app.listen(3000,function() {
  console.log("Server is running on port 3000");
});
