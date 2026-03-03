import { MercadoPagoConfig } from "mercadopago";

const mercadoPagoAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN!;

export const mercadoPagoClient = new MercadoPagoConfig({
  accessToken: mercadoPagoAccessToken,
});
