angular.module('BlocksApp').controller('AddressController', function($stateParams, $rootScope, $scope, $http, $location) {
    $scope.$on('$viewContentLoaded', function() {
        // initialize core components
        App.initAjax();
    });
    var activeTab = $location.url().split('#');
    if (activeTab.length > 1)
      $scope.activeTab = activeTab[1];

    $rootScope.$state.current.data["pageSubTitle"] = $stateParams.hash;
    $scope.addrHash = $stateParams.hash;
    $scope.addr = {"balance": 0, "count": 0, "signed": 0};
    $rootScope.isHome = false;

    //fetch web3 stuff
    $http({
      method: 'POST',
      url: '/web3relay',
      data: {"addr": $scope.addrHash, "options": ["balance", "count", "bytecode", "checksummedAddr"]}
    }).success(function(data) {
      $scope.addr = data;
      $rootScope.$state.current.data["pageSubTitle"] = $scope.addr.checksummedAddr;
      fetchTxs($scope.addr.count);
      if (data.isContract) {
        $rootScope.$state.current.data["pageTitle"] = "Contract Address";
        fetchInternalTxs();
      }
    });

    //fetch signed blocks
    $http({
      method: 'POST',
      url: '/signed',
      data: {"addr": $scope.addrHash}
    }).success(function(data) {
      $scope.addr.signed = data.signed;      
    });

    //fetch transactions
    var fetchTxs = function(count) {
      $("#table_txs").DataTable({
        processing: true,
        serverSide: true,
        paging: true,
        ajax: {
          url: '/addr',
          type: 'POST',
          data: { "addr": $scope.addrHash, "count": count }
        },
        "lengthMenu": [
                    [10, 20, 50, 100, 250],
                    [10, 20, 50, 100, 250] // change per page values here
                ],
        "pageLength": 20,
        "order": [
            [6, "desc"]
        ],
        "language": {
          "lengthMenu": "_MENU_ transactions",
          "zeroRecords": "No transactions found",
          "infoEmpty": "No results",
          "infoFiltered": "(filtered from _MAX_ total txs)"
        },
        "columnDefs": [
          { "targets": [ 5 ], "visible": false, "searchable": false },
          {"type": "date", "targets": 6},
          {"orderable": false, "targets": [0,2,3]},
          { "render": function(data, type, row) {
                        if (data != $scope.addrHash)
                          return '<a href="/addr/'+data+'">'+data+'</a>'
                        else
                          return data
                      }, "targets": [2,3]},
          { "render": function(data, type, row) {
                        return '<a href="/block/'+data+'">'+data+'</a>'
                      }, "targets": [1]},
          { "render": function(data, type, row) {
                        return '<a href="/tx/'+data+'">'+data+'</a>'
                      }, "targets": [0]},
          { "render": function(data, type, row) {
                        return getDuration(data).toString();
                      }, "targets": [6]},
          ]
      });
    }

    var fetchInternalTxs = function() {
      $http({
        method: 'POST',
        url: '/web3relay',
        data: {"addr_trace": $scope.addrHash}
      }).success(function(data) {
        $scope.internal_transactions = data;
      });
    }

})
.directive('contractSource', function($http) {
  return {
    restrict: 'E',
    templateUrl: '/views/contract-source.html',
    scope: false,
    link: function(scope, elem, attrs){
        //fetch contract stuff
        $http({
          method: 'POST',
          url: '/compile',
          data: {"addr": scope.addrHash, "action": "find"}
        }).success(function(data) {
          console.log(data);
          scope.contract = data;
        });
      }
  }
})
