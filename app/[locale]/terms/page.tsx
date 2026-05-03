import { createPublicInfoPage } from "@/lib/public-info-page";

const infoPage = createPublicInfoPage("terms");

export const generateMetadata = infoPage.generateMetadata;
export default infoPage.default;
