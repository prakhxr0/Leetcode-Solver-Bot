import React from "react";
import { Box, Text } from "ink";

const QUOTE = '"I came, I saw, I copied the optimal solution."';
const ATTRIBUTION = "~ Julius Caesar prolly";
const GITHUB_URL = "https://github.com/PrakharMishra531";

const Banner = () => (
    <Box
        flexDirection="column"
        alignItems="center"
        marginTop={1}
        marginBottom={1}
    >
        <Text bold color="#FFA116">
            {
                "██╗     ███████╗███████╗████████╗ ██████╗  ██████╗ ██████╗ ███████╗"
            }
        </Text>
        <Text bold color="#FFA116">
            {
                "██║     ██╔════╝██╔════╝╚══██╔══╝██╔════╝ ██╔═══██╗██╔══██╗██╔════╝"
            }
        </Text>
        <Text bold color="#FFA116">
            {
                "██║     █████╗  █████╗     ██║   ██║      ██║   ██║██║  ██║█████╗  "
            }
        </Text>
        <Text bold color="#FFA116">
            {
                "██║     ██╔══╝  ██╔══╝     ██║   ██║      ██║   ██║██║  ██║██╔══╝  "
            }
        </Text>
        <Text bold color="#FFA116">
            {
                "███████╗███████╗███████╗   ██║   ╚██████╗ ╚██████╔╝██████╔╝███████╗"
            }
        </Text>
        <Text bold color="#FFA116">
            {
                "╚══════╝╚══════╝╚══════╝   ╚═╝    ╚═════╝  ╚═════╝ ╚═════╝ ╚══════╝"
            }
        </Text>
        <Box marginTop={0} flexDirection="column" alignItems="center">
            <Text bold color="#FFF">
                {"  S  O  L  V  E  R  "}
            </Text>
            <Text color="#FFA116">
                {
                    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                }
            </Text>
        </Box>
    </Box>
);

export default Banner;
