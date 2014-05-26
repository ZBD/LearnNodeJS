var todo = angular.module('todo', []);

function mainController($scope, $http) {
	$scope.formData = {};
	$http.get('/api/todos')
		.success(function(data) {
			$scope.todos = data;
            if (data.length > 1) {
                $scope.thingORthings = 'things';
            }
            else {
                $scope.thingORthings = 'thing';
            }
			console.log(data);
		})
		.error(function(data) {
			console.log('Error:' + data);
		});
	$scope.createTodo = function() {
		$http.post('/api/todos', $scope.formData)
			.success(function(data) {
				$scope.formData = {};
				$scope.todos = data;
                if (data.length > 1) {
                    $scope.thingORthings = 'things';
                }
                else {
                    $scope.thingORthings = 'thing';
                }
				console.log(data);
			})
			.error(function(data) {
				console.log('Error:' + data);
			});
	};

	$scope.deleteTodo = function(id) {
		$http.delete('/api/todos/' + id)
			.success(function(data) {
				$scope.todos = data;
                if (data.length > 1) {
                    $scope.thingORthings = 'things';
                }
                else {
                    $scope.thingORthings = 'thing';
                }
				console.log(data);
			})
			.error(function(data) {
				console.log('Error:' + data);
			});
	};
}
