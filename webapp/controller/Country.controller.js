sap.ui.define([
		"./BaseController",
		'jquery.sap.global',
		'sap/m/MessageToast',
		'sap/ui/core/mvc/Controller',
		'sap/ui/model/json/JSONModel'
	], function(BaseController, jQuery, MessageToast, Controller, JSONModel) {
	"use strict";

		return BaseController.extend("com.BandB.BandB.controller.Country", {

		onInit : function() {
		},
		
		onPress: function(oEvent) {
			var oItem;

			oItem = oEvent.getParameter("listItem");
			var sCountry = oItem.getBindingContext().getProperty("COUNTRY");
		var router = sap.ui.core.UIComponent.getRouterFor(this);
			router.navTo("city",{
				COUNTRY: sCountry
			});
		}

	});
});
