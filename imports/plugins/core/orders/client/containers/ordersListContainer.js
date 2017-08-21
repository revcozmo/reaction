import React, { Component } from "react";
import PropTypes from "prop-types";
import { composeWithTracker } from "@reactioncommerce/reaction-components";
import { Meteor } from "meteor/meteor";
import { Tracker } from "meteor/tracker";
import { Media, Orders } from "/lib/collections";
import { Reaction } from "/client/api";
import { Loading } from "/imports/plugins/core/ui/client/components";
import OrdersList from "../components/orderList.js";
import {
  PACKAGE_NAME,
  // ORDER_LIST_FILTERS_PREFERENCE_NAME,
  ORDER_LIST_SELECTED_ORDER_PREFERENCE_NAME
} from "../../lib/constants";

const OrderHelper =  {
  makeQuery(filter) {
    let query = {};

    switch (filter) {
      // New orders
      case "created":
        query = {
          "workflow.status": "new"
        };
        break;

      // Orders that have been approved
      case "approved":
        query = {
          "workflow.status": "coreOrderWorkflow/processing",
          "billing[0].paymentMethod.status": "approved"
        };
        break;

      // Orders that have been captured
      case "captured":
        query = {
          "billing[0].paymentMethod.status": "captured"
        };
        break;

      // Orders that are being processed
      case "processing":
        query = {
          "workflow.status": "coreOrderWorkflow/processing"
        };
        break;

      // Orders that are complete, including all items with complete status
      case "completed":
        query = {
          "workflow.status": {
            $in: ["coreOrderWorkflow/completed", "coreOrderWorkflow/canceled"]
          },
          "items.workflow.status": {
            $in: ["coreOrderItemWorkflow/completed", "coreOrderItemWorkflow/canceled"]
          }
        };
        break;

      case "canceled":
        query = {
          "workflow.status": "coreOrderWorkflow/canceled"
        };
        break;

      default:
    }

    return query;
  }
};

class OrdersListContainer extends Component {
  static propTypes = {
    handleMenuClick: PropTypes.func,
    orders: PropTypes.array
  }

  constructor(props) {
    super(props);

    this.state = {
      selectedItems: [],
      // orders: props.orders,
      multipleSelect: false,
      orders: [],
      ready: false,
      filter: "",
      query: {}
    };

    this.handleClick = this.handleClick.bind(this);
    this.handleDisplayMedia = this.handleDisplayMedia.bind(this);
    this.handleSelect = this.handleSelect.bind(this);
    this.selectAllOrders = this.selectAllOrders.bind(this);
    this.dep = new Tracker.Dependency;
  }

  componentDidMount() {
    Tracker.autorun(() => {
      this.dep.depend();

      const filter = this.state.filter;
      const query = OrderHelper.makeQuery(filter);
      this.subscription = Meteor.subscribe("CustomPaginatedOrders");

      if (this.subscription.ready()) {
        const orders = Orders.find(query).fetch();
        this.setState({
          orders,
          query,
          ready: true
        });
      }
    });
  }

  componentWillUnmount() {
    this.subscription.stop();
  }

  handleMenuClick = (event, value) => {
    this.setState({
      filter: value
    }, () => {
      this.dep.changed();
    });
  }

  handleSelect = (event, isInputChecked, name) => {
    this.setState({
      multipleSelect: false
    });
    const selectedItemsArray = this.state.selectedItems;

    if (!selectedItemsArray.includes(name)) {
      selectedItemsArray.push(name);
      this.setState({
        selectedItems: selectedItemsArray
      });
    } else {
      const updatedSelectedArray = selectedItemsArray.filter((id) => {
        if (id !== name) {
          return id;
        }
      });
      this.setState({
        selectedItems: updatedSelectedArray
      });
    }
  }

  selectAllOrders = (orders, areAllSelected) => {
    if (areAllSelected) {
      // if all orders are selected, clear the selectedItems array
      // and set multipleSelect to false
      this.setState({
        selectedItems: [],
        multipleSelect: false
      });
    } else {
      // if there are no selected orders, or if there are some orders that have been
      // selected but not all of them, loop through the orders array and return a
      // new array with order ids only, then set the selectedItems array with the orderIds
      const orderIds = orders.map((order) => {
        return order._id;
      });
      this.setState({
        selectedItems: orderIds,
        multipleSelect: true
      });
    }
  }

  handleClick = (order, startWorkflow = false) => {
    Reaction.setActionViewDetail({
      label: "Order Details",
      i18nKeyLabel: "orderWorkflow.orderDetails",
      data: {
        order: order
      },
      props: {
        size: "large"
      },
      template: "coreOrderWorkflow"
    });

    if (startWorkflow === true) {
      Meteor.call("workflow/pushOrderWorkflow", "coreOrderWorkflow", "processing", order);
    }

    const id = Reaction.Router.getQueryParam("_id");

    if (id === undefined) {
      Reaction.setUserPreferences(PACKAGE_NAME, ORDER_LIST_SELECTED_ORDER_PREFERENCE_NAME, order._id);
    } else {
      Reaction.Router.go("dashboard/orders", {}, {
        _id: order._id
      });
    }

    this.dep.changed();
  }

  /**
   * Media - find media based on a product/variant
   * @param  {Object} item object containing a product and variant id
   * @return {Object|false} An object contianing the media or false
   */
  handleDisplayMedia = (item) => {
    const variantId = item.variants._id;
    const productId = item.productId;

    const variantImage = Media.findOne({
      "metadata.variantId": variantId,
      "metadata.productId": productId
    });

    if (variantImage) {
      return variantImage;
    }

    const defaultImage = Media.findOne({
      "metadata.productId": productId,
      "metadata.priority": 0
    });

    if (defaultImage) {
      return defaultImage;
    }
    return false;
  }

  render() {
    if (this.state.ready) {
      return (
        <OrdersList
          handleSelect={this.handleSelect}
          orders={this.state.orders}
          query={this.state.query}
          handleClick={this.handleClick}
          displayMedia={this.handleDisplayMedia}
          selectedItems={this.state.selectedItems}
          selectAllOrders={this.selectAllOrders}
          multipleSelect={this.state.multipleSelect}
          handleMenuClick={this.handleMenuClick}
        />
      );
    }
    return <Loading />;
  }
}

const composer = (props, onData) => {
  const subscription = Meteor.subscribe("Media");
  if (subscription.ready()) {
    onData(null, {
      ...props
    });
  }
};

export default composeWithTracker(composer, Loading)(OrdersListContainer);
