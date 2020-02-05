import React from "react";
import { useProvide } from "~/lib/core";
import { Todo } from "~/services/Todo";

export const Footer = () => {
  const todo = useProvide(Todo);

  return (
    /* <!-- This footer should hidden by default and shown when there are todos --> */
    <footer className="footer">
      {/* <!-- This should be `0 items left` by default --> */}
      <span className="todo-count"><strong>{todo.getItemLeftCounter()}</strong> item left</span>
      {/* <!-- Remove this if you don't implement routing --> */}
      <ul className="filters">
        <li>
          <a className="selected" href="#/">All</a>
        </li>
        <li>
          <a href="#/active">Active</a>
        </li>
        <li>
          <a href="#/completed">Completed</a>
        </li>
      </ul>
      {/* <!-- Hidden if no completed items are left ↓ --> */}
      <button className="clear-completed">Clear completed</button>
    </footer>
  );
}
