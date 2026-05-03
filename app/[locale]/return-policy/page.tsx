import { createPublicInfoPage } from "@/lib/public-info-page";

const infoPage = createPublicInfoPage("return-policy");

export const generateMetadata = infoPage.generateMetadata;
export default infoPage.default;
