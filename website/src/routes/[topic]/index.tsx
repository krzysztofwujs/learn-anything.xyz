import GlobalGuide from "../../components/Topic/GlobalGuide"
// @ts-ignore
import { Motion } from "@motionone/solid"
import GuideSidebar from "../../components/Topic/GuideSidebar"
import { useGlobalState } from "../../GlobalContext/global"
import { Match, Switch, createEffect, createSignal } from "solid-js"
import GuideLinks from "../../components/Topic/GuideLinks"
import GuideNav from "../../components/Topic/GuideNav"
import clsx from "clsx"

export default function GlobalTopic() {
  const global = useGlobalState()
  const [blurWidth, setBlurWidth] = createSignal()

  createEffect(() => {
    const infoMain = document.getElementById("InfoMain")
    setBlurWidth(infoMain?.scrollHeight / 2)
  })

  return (
    <>
      <style>{`
        #InfoSidebar {
          display: none;
        }

        #InfoMain::-webkit-scrollbar {
          display: none;
        }
        #InfoOptions {
          display: none;
        }
      @media (min-width: 700px) {
        #InfoSidebar {
          display: flex;
        }

        #InfoOptions {
          display: flex
        }
      }
      #divider {
        background: linear-gradient(180deg, rgba(229,9,121,0) 0%, rgba(229,231,235,0.5) 100%);
          backdrop-filter: blur(4px)
            }
      `}</style>
      <div class="w-screen fixed top-0 right-0 h-screen text-black dark:text-white bg-white dark:bg-[#1C1C1C]">
        <GuideNav />

        <div class="h-[90%] w-full flex">
          <div
            id="InfoMain"
            class={clsx(
              " w-full bg-white h-full relative overflow-auto dark:bg-[#1C1C1C] flex gap-6 flex-col",
              true && ""
            )}
            style={{ padding: "24px 20px 24px 20px" }}
          >
            <Switch>
              <Match when={global.state.guidePage === "Guide"}>
                <GlobalGuide />
              </Match>
              <Match when={global.state.guidePage === "Links"}>
                <GuideLinks />
              </Match>
            </Switch>

            <div
              class="absolute flex flex-col right-0 z-50 w-full"
              style={{
                top: `${blurWidth()}px`,
                "min-height": `${blurWidth()}px`,
                height: `${blurWidth()}px`
              }}
            >
              <div
                class="absolute top-[-100px]  right-0 w-full bg-opacity-50 h-[100px]"
                id="divider"
              ></div>
              <div class="backdrop-blur-sm bg-opacity-50 bg-gray-200 dark:bg-black w-full h-full"></div>
            </div>
          </div>
          <Motion.div
            id="InfoSidebar"
            class="  dark:bg-[#161616] bg-[#F4F4F6] border-l-[0.5px] border-[#69696951] h-full min-w-[250px]"
          >
            <GuideSidebar></GuideSidebar>
          </Motion.div>
          {/* TODO: only here because commenting below block failed.. */}
          {/* add this when we have the data from server for who is learning the topic..  */}
        </div>
      </div>
    </>
  )
}
