sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/m/library",
	"sap/ui/core/Fragment",
	"sap/ui/vbm/GeoMap",
	"sap/m/MessageToast"
], function (BaseController, JSONModel, formatter, mobileLibrary, Fragment, GeoMap, MessageToast) {
	"use strict";

	// shortcut for sap.m.URLHelper
	var URLHelper = mobileLibrary.URLHelper;

	return BaseController.extend("com.BandB.BandB.controller.Detail", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function (oEvent) {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				lineItemListTitle: this.getResourceBundle().getText("detailLineItemTableHeading")
			});

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			this.setModel(oViewModel, "detailView");

			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
		},
		// select: function (oEvent) {
		// 	var oView = this.getView();
		// 	var oButton = oView.byId("__button3");
		// 	oButton.setEnabled(true);
		// },
		
		onAuthor: function (oEvent) {
			var oButton = oEvent.getSource();

			// create popover
			if (!this._oPopover) {
				Fragment.load({
					name: "com.BandB.BandB.view.fragment.Author",
					controller: this
				}).then(function(pPopover) {
					this._oPopover = pPopover;
					this.getView().addDependent(this._oPopover);
					this._oPopover.bindElement("/ProductCollection/0");
					this._oPopover.openBy(oButton);
				}.bind(this));
			} else {
				this._oPopover.openBy(oButton);
			}
		},
		
		onAuthorClose: function (oEvent) {
			this._oPopover.close();
		},
		
		onRatingChanged: function(oEvent) {
			var iValue = oEvent.getParameter("value"),
				sMessage =
				this.getResourceBundle().getText("productRatingSuccess", [iValue]);
				MessageToast.show(sMessage);
			var sBarID = this.getView().getBindingContext().getObject().BAR_ID,
				sReiting = iValue,
				oPayload = {
					BAR_ID: sBarID,
					REITING: sReiting
				},
				path = this.getModel().createKey("/BarsDetails", {
					BAR_ID: sBarID
				});
			this.getView().getModel().update(path, oPayload, {
				success: function () {
				},
				error: function (oResponce) {
					sap.m.MessageToast.show("Something went wrong: " + oResponce);
				}
			});
		},


		onPersonal: function() {
			var sBarID = this.getView().getBindingContext().getObject().BAR_ID;
			var router = sap.ui.core.UIComponent.getRouterFor(this);
			router.navTo("personal",{
				BAR_ID: sBarID
			});
		},

		onLiveChange: function (oEvent) {
			var newValue = oEvent.getParameter("newValue");

			if (newValue > 100 || newValue < 1) {
				this.byId("inputQuantity").setValueState(sap.ui.core.ValueState.Error);
			} else {
				this.byId("inputQuantity").setValueState(sap.ui.core.ValueState.None);
			}
		},

		onShowDetailPopover: function (oEvent) {
			var oPopover = this.byId("dimensionsPopover");
			var oSource = oEvent.getSource();
			oPopover.bindElement(oSource.getBindingContext().getPath());
			// open dialog
			oPopover.openBy(oEvent.getParameter("domRef"));
		},

		deselect: function (oEvent) {
			var oView = this.getView();
			var vBeerID = this.getView().byId("lineItemsList").getSelectedItem().getBindingContext().getObject().BEER_ID;
			var oButton = oView.byId("__button3");
			if (oButton.getEnabled() && ((vBeerID === null) || vBeerID === this.gBeerID)) {
				oView.byId("lineItemsList").removeSelections(true);
				oButton.setEnabled(false);
				this.byId("productDetailsPanel").setVisible(false);
			} else if (oButton.getEnabled() && vBeerID !== this.gBeerID) {
				oButton.setEnabled(true);
			} else {
				oButton.setEnabled(true);
			}
			if (oButton.getEnabled() === false) {
				this.gBeerID = null;
			} else {
				this.gBeerID = this.getView().byId("lineItemsList").getSelectedItem().getBindingContext().getObject().BEER_ID;

			}
			var oTable = this.getView().byId("lineItemsList"),
				oContext = oTable.getSelectedItem().getBindingContext();
			var sPath = oContext.getPath();
			var oProductDetailPanel = this.byId("productDetailsPanel");
			oProductDetailPanel.bindElement({
				path: sPath
			});
			this.byId("productDetailsPanel").setVisible(true);
			// var oView = this.getView();
			// var oTable = this.getView().byId("lineItemsList"),
			// 	oContext = oTable.getSelectedItem().getBindingContext(),
			// 	gBeerID = oEvent.getSource().oContext.getProperty("BEER_ID");
			// if (gBeerID = gBeerID) {
			// 	oView.byId("lineItemsList").removeSelections(true);
			// 	// oView.byId("__button3").setEnabled(false);
			// }
		},

		onDelete1: function (oEvent) {
			var oView = this.getView();
			var oTable = this.getView().byId("lineItemsList"),
				oContext = oTable.getSelectedItem().getBindingContext();
			var sBeerID = oContext.getProperty("BEER_ID"), // A single property from the bound model
				sBarID = oView.getBindingContext().getObject().BAR_ID,
				oPayload = {};
			oPayload = {
				BAR_ID: sBarID,
				BEER_ID: sBeerID
			};
			var path = this.getModel().createKey("/BarsAndBeers", {
				BAR_ID: sBarID,
				BEER_ID: sBeerID
			});

			var that = this;
			oView.getModel().remove(path, {
				method: "DELETE",
				success: function (oData, oResponse) {
					sap.m.MessageToast.show("Delete successful");
					that.getView().getModel().refresh();
					that.byId("productDetailsPanel").setVisible(false);
				},
				error: function (oResponse) {
					sap.m.MessageToast.show("Delete failed" + oResponce);
				}
			});
			this.getView().byId("__button3").setEnabled(false);
		},

		// onDelete: function (oEvent) {
		// 	var oView = this.getView();

		// 	var oItem = oEvent.getSource(); // The model that is bound to the item
		// 	var oContext = oItem.getBindingContext(); //the name of your model should be a parameter in getBindingContext
		// 	var sBeerID = oContext.getProperty("BEER_ID"), // A single property from the bound model
		// 		sBarID = oView.getBindingContext().getObject().BAR_ID, // retrieves BarId
		// 		oPayLoad = {
		// 			BAR_ID: sBarID,
		// 			BEER_ID: sBeerID
		// 		},
		// 		path = this.getModel().createKey("/BarsAndBeers", {
		// 			BAR_ID: sBarID,
		// 			BEER_ID: sBeerID
		// 		});

		// 	oView.getModel().remove(path, {
		// 		succes: function () {
		// 			sap.m.MessageToast.show("Delete successful");
		// 		},
		// 		error: function () {
		// 			sap.m.MessageToast.show("Delete failed");
		// 		}
		// 	});
		// },

		// onAfterRendering function of controller

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */

		onSendEmailPress: function () {
			var oViewModel = this.getModel("detailView");

			URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},

		onbuttonpress: function (oEvent) {
			var oView = this.getView();
			var oSelectedItem = oEvent.getSource();
			var oContext = oSelectedItem.getBindingContext();
			var path = oContext.getPath();
			var oItem = oEvent.getSource();
			var sBarID = oView.getBindingContext().getObject().BAR_ID,
				sBeerName = oContext.getProperty("BEER_NAME"),
				sQuantity = oContext.getProperty("QUANTITY"),
				sPrice = oContext.getProperty("PRICE"),
				sCurrency = oContext.getProperty("CURRENCY"),
				sBarName = oContext.getProperty("BAR_NAME");

			this.sBeerID = oEvent.getSource().getBindingContext().getProperty("BEER_ID");

			// create dialog lazily
			if (!this.byId("openDialog")) {
				// load asynchronous XML fragment
				Fragment.load({
					id: oView.getId(),
					name: "com.BandB.BandB.view.fragment.edit",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view 
					//of this component (models, lifecycle)
					oView.addDependent(oDialog);
					oDialog.bindElement({
						path: path,
						model: ""
					});
					oDialog.open();
					oView.byId("inputBeerName").setValue(sBeerName);
					oView.byId("inputQuantity").setValue(sQuantity);
					oView.byId("inputPrice").setValue(sPrice);
					oView.byId("inputCurrency").setValue(sCurrency);
				});
			}
		},

		dialogAfterclose1: function (oEvent) {
			var oView = this.getView();
			var oDialog = oView.byId("openDialog");
			oDialog.destroy();
		},
		closeDialog: function () {
			var oView = this.getView();
			var oDialog = oView.byId("openDialog");
			oDialog.close();
		},
		updateDialog: function () {
			var oView = this.getView(),
				oDialog = oView.byId("openDialog"),
				sBeerName = oView.byId("inputBeerName").getValue(),
				sQuantity = oView.byId("inputQuantity").getValue(),
				sPrice = oView.byId("inputPrice").getValue(),
				sCurrency = oView.byId("currency").getSelectedKey(),
				sBarID = this.getView().getBindingContext().getObject().BAR_ID,
				sBeerID = this.sBeerID,
				oPayload = {
					BEER_NAME: sBeerName,
					QUANTITY: sQuantity,
					PRICE: sPrice,
					CURRENCY: sCurrency,
					BEER_ID: sBeerID,
					BAR_ID: sBarID
				},
				path = this.getModel().createKey("/BarsAndBeers", {
					BAR_ID: sBarID,
					BEER_ID: sBeerID
				});
			var that = this;
			oView.getModel().update(path, oPayload, {
				success: function () {
					sap.m.MessageToast.show("Record updated");
					that.getView().getModel().refresh();
					oDialog.close();
				},
				error: function (oResponce) {
					sap.m.MessageToast.show("Something went wrong: " + oResponce);
				}
			});
		},

		onAdd: function () { // ADD FUNCTION
			var oView = this.getView();
			var oDialog = oView.byId("addAction");
			if (!oDialog) {
				oDialog = sap.ui.xmlfragment(oView.getId(), "com.BandB.BandB.view.fragment.addBeer", this);
				oView.addDependent(oDialog);
			}
			oDialog.open();
		},
		dialogAfterclose: function (oEvent) {
			var oView = this.getView();
			var oDialog = oView.byId("addAction");
			oDialog.destroy();
		},

		onCloseDialog: function () {
			var oView = this.getView();
			var oDialog = oView.byId("addAction");
			oDialog.close();
		},
		onConfirmDialog: function () {
			var oView = this.getView(),
				oDialog = oView.byId("addAction"),
				sBeerName = oView.byId("inputBeerName").getValue(),
				sQuantity = oView.byId("inputQuantity").getValue(),
				sPrice = oView.byId("inputPrice").getValue(),
				sCurrency = oView.byId("inputCurrency").getSelectedKey(),
				sBarName = this.getView().getBindingContext().getObject().BAR_NAME,
				sBarID = this.getView().getBindingContext().getObject().BAR_ID,
				oPayload = {};
			oPayload = {
				BEER_NAME: sBeerName,
				QUANTITY: sQuantity,
				PRICE: sPrice,
				CURRENCY: sCurrency,
				BEER_ID: "0",
				BAR_ID: sBarID,
				BAR_NAME: sBarName
			};
			var that = this;
			oView.getModel().create("/BarsAndBeers", oPayload, {
				success: function () {
					sap.m.MessageToast.show("New record created");
					that.getView().getModel().refresh();
					oDialog.close();
				},
				error: function (oResponce) {
					sap.m.MessageToast.show("Something went wrong: " + oResponce);
				}
			});
		},

		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function () {
			var oViewModel = this.getModel("detailView"),
				oShareDialog = sap.ui.getCore().createComponent({
					name: "sap.collaboration.components.fiori.sharing.dialog",
					settings: {
						object: {
							id: location.href,
							share: oViewModel.getProperty("/shareOnJamTitle")
						}
					}
				});

			oShareDialog.open();
		},

		/**
		 * Updates the item count within the line item table's header
		 * @param {object} oEvent an event containing the total number of items in the list
		 * @private
		 */
		onListUpdateFinished: function (oEvent) {
			var sTitle,
				iTotalItems = oEvent.getParameter("total"),
				oViewModel = this.getModel("detailView");

			// only update the counter if the length is final
			if (this.byId("lineItemsList").getBinding("items").isLengthFinal()) {
				if (iTotalItems) {
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
				} else {
					//Display 'Line Items' instead of 'Line items (0)'
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeading");
				}
				oViewModel.setProperty("/lineItemListTitle", sTitle);
			}
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function (oEvent) {
			var sObjectId = oEvent.getParameter("arguments").objectId;
			this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
			this.getModel().metadataLoaded().then(function () {
				var sObjectPath = this.getModel().createKey("Bars", {
					BAR_ID: sObjectId
				});
				this._bindView("/" + sObjectPath);
			}.bind(this));
			this.getView().byId("__button3").setEnabled(false);
			this.getView().byId("lineItemsList").removeSelections(true);
			this.byId("productDetailsPanel").setVisible(false);
			this.getView().getModel().refresh();
		},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function (sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("detailView");

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function () {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function () {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		_onBindingChange: function () {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;

			}

			var sPath = oElementBinding.getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath),
				sObjectId = oObject.BAR_ID,
				sObjectName = oObject.BAR_NAME,
				oViewModel = this.getModel("detailView");

			this.getOwnerComponent().oListSelector.selectAListItem(sPath);

			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("shareSaveTileAppTitle", [sObjectName]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
			var me = this;
			this.loadGoogleMaps("https://maps.googleapis.com/maps/api/js?key=AIzaSyBtHDTDP8B61HmRM3jIFZoenVmYUdlhWb0", me.setMapData.bind(me));
		},

		_onMetadataLoaded: function () {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView"),
				oLineItemTable = this.byId("lineItemsList"),
				iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);
			oViewModel.setProperty("/lineItemTableDelay", 0);

			oLineItemTable.attachEventOnce("updateFinished", function () {
				// Restore original busy indicator delay for line item table
				oViewModel.setProperty("/lineItemTableDelay", iOriginalLineItemTableBusyDelay);
			});

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},

		/**
		 * Set the full screen mode to false and navigate to master page
		 */
		onCloseDetailPress: function () {
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
			// No item should be selected on master after detail page is closed
			this.getOwnerComponent().oListSelector.clearMasterListSelection();
			this.getRouter().navTo("master");
		},

		/**
		 * Toggle between full and non full screen mode.
		 */
		toggleFullScreen: function () {
			var bFullScreen = this.getModel("appView").getProperty("/actionButtonsInfo/midColumn/fullScreen");
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", !bFullScreen);
			if (!bFullScreen) {
				// store current layout and go full screen
				this.getModel("appView").setProperty("/previousLayout", this.getModel("appView").getProperty("/layout"));
				this.getModel("appView").setProperty("/layout", "MidColumnFullScreen");
			} else {
				// reset to previous layout
				this.getModel("appView").setProperty("/layout", this.getModel("appView").getProperty("/previousLayout"));
			}
		},

		onTabChange: function () {
			var me = this;
			this.loadGoogleMaps("https://maps.googleapis.com/maps/api/js?key=AIzaSyBtHDTDP8B61HmRM3jIFZoenVmYUdlhWb0", me.setMapData.bind(me));
		},

		// function for loading google maps
		loadGoogleMaps: function (scriptUrl, callbackFn) {
			var script = document.createElement('script');
			script.onload = function () {
				callbackFn();
			}
			script.src = scriptUrl;
			document.body.appendChild(script);
		},

		// function to set map data
		setMapData: function () {
			var address = this.getView().getModel("appView").getProperty("/street");
			var formattedAddress = address.replace(/ /g, '+');
			var oGoogleModel = new sap.ui.model.json.JSONModel('https://maps.googleapis.com/maps/api/geocode/json?address=' + formattedAddress +
				',Riga&key=' + 'AIzaSyBGesGcaaltdGUUKKY6A7HQ4regjFRQV9c');
			var oModel = this.getModel();
			var that = this;
			oGoogleModel.attachRequestCompleted(oModel, function (oEventG) {
				var oModelG = oEventG.getSource();
				var data = oModelG.getData().results[0].geometry.location;
				that.lat = data.lat;
				that.lng = data.lng;
				var myCenter = new google.maps.LatLng(that.lat, that.lng);
				var mapProp = {
					center: myCenter,
					zoom: 14,
					scrollwheel: true,
					draggable: true,
					mapTypeId: google.maps.MapTypeId.ROADMAP
				};
				var map = new google.maps.Map(that.getView().byId("googleMap").getDomRef(), mapProp);
				var marker = new google.maps.Marker({
					position: myCenter,
					title: address,
					animation: google.maps.Animation.DROP
				});
				marker.setMap(map);
			});
		}
	});

});