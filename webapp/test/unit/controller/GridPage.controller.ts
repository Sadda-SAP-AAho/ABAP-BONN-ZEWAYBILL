/*global QUnit*/
import Controller from "zirn/controller/Grid.controller";

QUnit.module("Grid Controller");

QUnit.test("I should test the Grid controller", function (assert: Assert) {
	const oAppController = new Controller("Grid");
	oAppController.onInit();
	assert.ok(oAppController);
});