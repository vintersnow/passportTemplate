/*global ko*/

var viewModel = {
  em:ko.observable(),
  pw:ko.observable(),
  pwc:ko.observable(""),
  ispwsame : function(){
    // console.log(viewModel);
    if (viewModel.pw() === "" || viewModel.pw() === undefined) {
      return "";
    }else if (viewModel.pw()!==viewModel.pwc()) {
      return "not same";
    }else{
      return "OK^^";
    }
  },
  enough_input: function(){
    if ( !(viewModel.em === "" || viewModel.em === undefined ) &&
      !(viewModel.pw() === "" || viewModel.pw() === undefined) &&
      viewModel.pw()===viewModel.pwc() ) {
      return true;
    }else{
      return false;
    }
    // return true;
  }
};

ko.applyBindings(viewModel);