var app = new Vue({
  el: '#app',
  data: {
    store_url: "https://raw.githubusercontent.com/TPei/yappl_transformation_functions/master/store.json",
    deployerUrl: "", // read from env file
    func: new Func({}),
    cart: [],
    search: '',
    functions: [],
    showSpinner: true,
    deployOutput: [],
  },

  methods: {
    itemClicked: function(func) {
      this.func = func;
      $("#function-modal").modal('show');
    },
    showCart: function() {
      $("#cart-modal").modal('show');
    },
    addToCart: function(func) {
      // only add if not in there yet
      if(this.cart.findIndex(el => el === func) == -1)
        this.cart.push(func);
    },
    removeFromCart: function(func) {
      const index = this.cart.findIndex(el => el === func)
      if(index > -1)
        this.cart.splice(index, 1);
    },
    isInCart: function(func) {
      if(this.cart.findIndex(el => el === func) == -1)
        return false;
      return true;
    },
    cartNotEmpty: function() {
      return this.cart.length > 0;
    },
    downloadCart: function() {
      let text = "packages:\n  function_store:\n    actions:\n"
      this.cart.forEach(function(func) {
        text += "      " + func.name + ":\n"
        text += "        function: " + func.code_link + "\n"
      })
      let element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
      element.setAttribute('download', 'manifest.yml');

      element.style.display = 'none';
      document.body.appendChild(element);

      element.click();

      document.body.removeChild(element);
    },
    openDeployModal: function() {
      $('#cart-modal').modal('hide');
      $('#deploy-modal').modal('show');
      this.prepareFunctions();
    },
    prepareFunctions: function() {
      let self = this;
      let prepareData = [];
      let deployData = [];
      let errors = false;

      this.deployOutput.push("Preparing Functions...");
      this.cart.forEach(function(func) {
        let name = func.name;
        let runtime = func.runtime;
        let url = func.code_link;
        let package = "deployer";

        self.deployOutput.push("Preparing " + name + "...");
        // do ajax call to get code...
        $.get(url, function(data) {
          let code = data;
          console.log(code);
          self.deployOutput.push("Done preparing " + name + "...")
          prepareData.push(name);

          if(prepareData.length == self.cart.length)
            self.deployOutput.push("Done preparing functions");

          console.log(env.url)
          self.deployerUrl = env.url
          self.deployOutput.push("Deploying " + name + "...");

          let deployRequestBody = JSON.stringify(
            { name: name, package: package, code: code, runtime: runtime }
          )
          console.log("deploying with:");
          console.log(deployRequestBody);

          $.ajax({
            type: "POST",
            url: self.deployerUrl,
            data: deployRequestBody,
            contentType: "application/json; charset=utf-8",
            dataType: "json"
          })
            .done(function(data) {
              console.log(data);
              self.deployOutput.push("Deployed " + name + " successfully...");
              // TODO: check if error and display accordingly
            }).fail(function(data) {
              self.deployOutput.push("Deploying " + name + " failed! :(");
              errors = true;
            }).always(function(data) {
              deployData.push(name);
              if(deployData.length == self.cart.length) {
                self.deployOutput.push("Done deploying functions!");
                if(errors == true)
                  self.deployOutput.push("There were some errors :(");

                self.showSpinner = false;
              }
            })
        });
      });
    },
    closeDeployDialog: function() {
      this.deployOutput = [];
      this.showSpinner = true;
    },
    showStoreUrl: function() {
      $("#store-url-modal").modal('show');
    },
    setStoreUrl: function() {
      const url = $("#store-url-input").val();
      $("#store-url-input").val("");
      this.store_url = url;
      this.fetchFunctions();
      $("#store-url-modal").modal('hide');
    },
    fetchFunctions: function() {
      $.ajaxSetup({ cache: false });
      $.getJSON(this.store_url, function(data) {
        this.setFunctions(data.functions);
      }.bind(this));
    },
    setFunctions: function(functions) {
      this.functions = functions.map(f => new Func(f))
    },
  },

  mounted: function() {
    // TODO: should work...
    //Vue.nextTick()
      //.then(function () {
        //this.fetchFunctions();
    //}.bind(this))

    setTimeout(function(){
      this.fetchFunctions();
    }.bind(this), 100);
  },

  computed: {
    filteredList: function filteredList() {
      var _this = this;
      return this.functions.filter(function(func) {
        included = false;
        if(func.name.toLowerCase().includes(_this.search.toLowerCase()))
          included = true;

        let match = func.compatibility.map(function(compat) {
          return compat.toLowerCase().includes(_this.search.toLowerCase())
        }).some(ele => ele == true)

        if(match == true)
          included = true;

        if(func.author.toLowerCase().includes(_this.search.toLowerCase()))
          included = true;

        return included;
      });
    }
  }
});
