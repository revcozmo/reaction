import { Random } from "meteor/random";
import { SimpleSchema } from "meteor/aldeed:simple-schema";
import { Metafield } from "./metafield";
import { registerSchema } from "@reactioncommerce/reaction-collections";

/**
* Reaction Schemas Address
*/

export const Address = new SimpleSchema({
  _id: {
    type: String,
    defaultValue: Random.id(),
    optional: true
  },
  fullName: {
    type: String,
    label: "Full name"
  },
  address1: {
    label: "Address 1",
    type: String
  },
  address2: {
    label: "Address 2",
    type: String,
    optional: true
  },
  city: {
    type: String,
    label: "City"
  },
  company: {
    type: String,
    label: "Company",
    optional: true
  },
  phone: {
    type: String,
    label: "Phone"
  },
  region: {
    label: "State/Province/Region",
    type: String
  },
  postal: {
    label: "ZIP/Postal Code",
    type: String
  },
  country: {
    type: String,
    label: "Country"
  },
  isCommercial: {
    label: "This is a commercial address.",
    type: Boolean
  },
  isBillingDefault: {
    label: "Make this your default billing address?",
    type: Boolean
  },
  isShippingDefault: {
    label: "Make this your default shipping address?",
    type: Boolean
  },
  failedValidation: {
    label: "Failed validation",
    type: Boolean,
    defaultValue: false,
    optional: true
  },
  metafields: {
    type: [Metafield],
    optional: true
  }
});

registerSchema("Address", Address);
