require("dotenv").config();
const express = require("express");
let bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dns = require("dns");
const app = express();
const PORT = 5000;

mongoose.connect(process.env.URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(express.static(`${process.cwd()}/public`));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const Schema = mongoose.Schema;
const urlSchema = new Schema({
  original_url: { type: String, required: true },
});

const Url = mongoose.model("Url", urlSchema);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/shorturl", (req, res) => {
  var original_url = req.body.url;
  var url_to_be_tested = original_url.slice(8);
  console.log(url_to_be_tested.slice(4).split("/")[0]);
  if (original_url.slice(0, 8) !== "https://")
    res.json({ error: "Invalid URL" });
  else {
    dns.lookup(
      url_to_be_tested.slice(0, 3) == "www"
        ? url_to_be_tested.slice(4).split("/")[0]
        : url_to_be_tested.split("/")[0],
      (err, address, family) => {
        if (err) console.log(err);
        if (address) {
          var urlFound = {};
          async function m() {
            await mongoose.connect(process.env.URI, {
              useNewUrlParser: true,
              useUnifiedTopology: true,
            });
            urlFound = await Url.findOne({ original_url: original_url }).exec();
            if (urlFound) {
              res.json({
                original_url: urlFound.original_url,
                short_url: urlFound._id,
              });
            } else {
              const orig_url = new Url({ original_url: req.body.url });
              await orig_url.save();
              res.json({ original_url: req.body.url, short_url: orig_url._id });
            }
          }
          m();
        } else res.json({ error: "Invalid Hostname" });
      }
    );
  }
});

app.get("/api/shorturl/:short", (req, res) => {
  var { short } = req.params;
  console.log(short);
  async function n() {
    try {
      var urlFounded = await Url.findOne({ _id: short }).exec();
      if (urlFounded) {
        res.writeHead(301, { location: urlFounded.original_url }).end();
      } else res.json({ error: "No short URL found for the given input" });
    } catch {
      res.json({ error: "No short URL found for the given input" });
    }
  }
  n();
});

app.listen(PORT, () => {
  console.log(`Listenning to port: ${PORT}`);
});
