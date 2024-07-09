import { initMiddleware } from '@/lib/init-middleware';
import Cors from 'cors';
import { NextResponse } from "next/server";
import sha256 from "crypto-js/sha256";
import axios from "axios";

// Initialize the cors middleware
const cors = initMiddleware(
    Cors({
        origin: 'http://localhost:3000',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    })
);


export async function POST(req, res) {

    await cors(req, res);

    const { code, merchantId, transactionId } = await req.json();

    const salt = process.env.NEXT_PUBLIC_SALT_KEY;
    const fullURL = `/pg/v1/status/${merchantId}/${transactionId}${salt}`;
    const dataSha256 = sha256(fullURL).toString();

    const checksum = `${dataSha256}###${process.env.NEXT_PUBLIC_SALT_INDEX}`;
    console.log(checksum);

    const options = {
        method: "GET",
        url: `https://api.phonepe.com/apis/hermes/pg/v1/status/${merchantId}/${transactionId}`,
        headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            "X-VERIFY": checksum,
            "X-MERCHANT-ID": merchantId,
        },
    };

    try {
        const response = await axios.request(options);
        console.log("r===", response.data.code);

        if (response.data.code === "PAYMENT_SUCCESS") {
            return NextResponse.redirect("http://localhost:3000/success", {
                status: 301,
            });
        } else {
            return NextResponse.redirect("http://localhost:3000/failure", {
                status: 301,
            });
        }
    } catch (error) {
        console.error("Payment status request error: ", error.response ? error.response.data : error.message);
        return NextResponse.redirect("http://localhost:3000/failure", {
            status: 301,
        });
    }
}
