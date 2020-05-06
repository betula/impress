import React, { useMemo } from "react";
import { mount } from "enzyme";
import { store, useSubscribe, set } from "../src";

test("Should update component with useSubscribe", () => {
  class A {
    state = "D";
  }
  const C = () => {
    const a = useMemo(() => store(A), []);
    useSubscribe(a);
    return <p onClick={() => set(a, "DD")}>{a.state}</p>
  };
  const el = mount(<C/>);
  expect(el.find("p").text()).toBe("D");
  el.find("p").simulate("click");
  expect(el.find("p").text()).toBe("DD");
});
