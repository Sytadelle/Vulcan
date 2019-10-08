import { Components, registerComponent, Utils } from 'meteor/vulcan:lib';
import React, { useState } from 'react';
import gql from 'graphql-tag';
import { useQuery } from '@apollo/react-hooks';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import moment from 'moment';

const getCount = columnFilters => {
  if (!columnFilters) {
    return 0;
  } else if (Array.isArray(columnFilters)) {
    return columnFilters.length;
  } else if (columnFilters.after || columnFilters.before) {
    if (columnFilters.after && columnFilters.before) {
      return 2;
    } else {
      return 1;
    }
  } else if (columnFilters.gte || columnFilters.lte) {
    if (columnFilters.gte && columnFilters.lte) {
      return 2;
    } else {
      return 1;
    }
  }
  return 0;
};

const Filter = ({ count }) => (
  <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
    <path
      fill="#000"
      d="M400 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48zm-6 400H54c-3.3 0-6-2.7-6-6V86c0-3.3 2.7-6 6-6h340c3.3 0 6 2.7 6 6v340c0 3.3-2.7 6-6 6z"
      fillOpacity={count ? 0.8 : 0.3}
    />
    {count ? (
      <text
        x="50%"
        y="55%"
        fill="#000"
        fontSize="300px"
        textAnchor="middle"
        alignmentBaseline="middle"
        fillOpacity={0.8}>
        {count}
      </text>
    ) : (
      <path
        fill="#000"
        d="M224 200v-16c0-13.3-10.7-24-24-24h-24v-20c0-6.6-5.4-12-12-12h-8c-6.6 0-12 5.4-12 12v20h-24c-13.3 0-24 10.7-24 24v16c0 13.3 10.7 24 24 24h24v148c0 6.6 5.4 12 12 12h8c6.6 0 12-5.4 12-12V224h24c13.3 0 24-10.7 24-24zM352 328v-16c0-13.3-10.7-24-24-24h-24V140c0-6.6-5.4-12-12-12h-8c-6.6 0-12 5.4-12 12v148h-24c-13.3 0-24 10.7-24 24v16c0 13.3 10.7 24 24 24h24v20c0 6.6 5.4 12 12 12h8c6.6 0 12-5.4 12-12v-20h24c13.3 0 24-10.7 24-24z"
        fillOpacity={0.3}
      />
    )}
  </svg>
);

const DatatableFilter = props => {
  const { columnFilters, label, query, Components } = props;

  return (
    <span className="datatable-filter">
      <Components.ModalTrigger
        title={
          <FormattedMessage
            id="datatable.filter_column"
            values={{ label }}
            defaultMessage={`Filter ${label}`}
          />
        }
        size="small"
        trigger={<Filter count={getCount(columnFilters)} />}>
        {query ? (
          <Components.DatatableFilterContentsWithData {...props} />
        ) : (
          <Components.DatatableFilterContents {...props} />
        )}
      </Components.ModalTrigger>
    </span>
  );
};

registerComponent('DatatableFilter', DatatableFilter);

/*

DatatableFilterContents Components

*/

const DatatableFilterContentsWithData = props => {
  const { query, options } = props;

  const filterQuery = gql`
    query ${name}FilterQuery {
      ${query}
    }
  `;

  const { loading, error, data } = useQuery(filterQuery);

  if (loading) {
    return <Components.Loading />;
  } else if (error) {
    return <p>error</p>;
  } else {
    // note: options function expects the entire props object
    const queryOptions = options({ data });
    return <Components.DatatableFilterContents {...props} options={queryOptions} />;
  }
};

registerComponent('DatatableFilterContentsWithData', DatatableFilterContentsWithData);

const DatatableFilterContents = props => {
  const { name, field, options, columnFilters, submitFilters, filterComponent } = props;
  const fieldType = Utils.getFieldType(field);

  const [filters, setFilters] = useState(columnFilters);

  const filterProps = { ...props, filters, setFilters };

  let contents;

  if (filterComponent) {
    const CustomFilter = filterComponent;
    contents = <CustomFilter {...filterProps}/>;
  } else if (options) {
    contents = <Components.DatatableFilterCheckboxes {...filterProps} />;
  } else {
    switch (fieldType) {
      case Date:
        contents = <Components.DatatableFilterDates {...filterProps} />;
        break;

      case Number:
        contents = <Components.DatatableFilterNumbers {...filterProps} />;
        break;

      default:
        contents = <p><FormattedMessage id="datatable.specify_option" defaultMessage="Please specify an options property on your schema field." /></p>;
    }
  }

  return (
    <form>
      {contents}
      <a
        style={{ display: 'inline-block', marginRight: 10 }}
        className="datatable_filter_clear"
        href="javascript:void(0)"
        onClick={() => {
          setFilters([]);
        }}>
        <FormattedMessage id="datatable.clear_all" defaultMessage="Clear All" />
      </a>
      <Components.Button
        type="submit"
        className="datatable_filter_submit"
        onClick={() => {
          submitFilters({ name, filters });
        }}>
        <FormattedMessage id="datatable.submit" defaultMessage="Submit" />
      </Components.Button>
    </form>
  );
};

registerComponent('DatatableFilterContents', DatatableFilterContents);

/*

Checkboxes

*/
const DatatableFilterCheckboxes = ({ field, options, filters = [], setFilters }) => {
  let value = filters;

  // all URL values are stored as strings, so convert them back to numbers if needed
  if (Utils.getFieldType(field) === Number) {
    value = filters.map(parseFloat);
  }

  return (
    <Components.FormComponentCheckboxGroup
      path="filter"
      itemProperties={{ layout: 'inputOnly' }}
      inputProperties={{ options }}
      value={value}
      updateCurrentValues={newValues => {
        setFilters(newValues.filter);
      }}
    />
  );
};

registerComponent('DatatableFilterCheckboxes', DatatableFilterCheckboxes);

/*

Dates

*/
const DatatableFilterDates = ({ filters, setFilters }) => (
  <div>
    <Components.FormComponentDate
      path="after"
      itemProperties={{
        label: <FormattedMessage id="datatable.after" defaultMessage="After" />,
        layout: 'horizontal',
      }}
      inputProperties={{}}
      value={filters && moment(filters.after, 'YYYY-MM-DD')}
      updateCurrentValues={newValues => {
        if (!newValues.after || newValues.after === '') {
          const newFilters = Object.assign({}, filters);
          delete newFilters.after;
          setFilters(newFilters);
        } else {
          setFilters({ ...filters, after: newValues.after.format('YYYY-MM-DD') });
        }
      }}
    />
    <Components.FormComponentDate
      path="before"
      itemProperties={{
        label: <FormattedMessage id="datatable.before" defaultMessage="Before" />,
        layout: 'horizontal',
      }}
      inputProperties={{}}
      value={filters && moment(filters.before, 'YYYY-MM-DD')}
      updateCurrentValues={newValues => {
        if (!newValues.before || newValues.before === '') {
          const newFilters = Object.assign({}, filters);
          delete newFilters.before;
          setFilters(newFilters);
        } else {
          setFilters({ ...filters, before: newValues.before.format('YYYY-MM-DD') });
        }
      }}
    />
  </div>
);

registerComponent('DatatableFilterDates', DatatableFilterDates);

/*

Numbers

*/
const DatatableFilterNumbers = ({ filters, setFilters }) => (
  <div>
    <Components.FormComponentNumber
      path="gte"
      itemProperties={{
        label: <FormattedMessage id="datatable.greater_than" defaultMessage="Greater than" />,
        layout: 'horizontal',
      }}
      inputProperties={{
        onChange: event => {
          const value = event.target.value;
          if (!value || value === '') {
            const newFilters = Object.assign({}, filters);
            delete newFilters.gte;
            setFilters(newFilters);
          } else {
            setFilters({ ...filters, gte: value });
          }
        },
        value: filters && parseFloat(filters.gte),
      }}
    />
    <Components.FormComponentNumber
      path="lte"
      itemProperties={{
        label: <FormattedMessage id="datatable.lower_than" defaultMessage="Lower than" />,
        layout: 'horizontal',
      }}
      inputProperties={{
        onChange: event => {
          const value = event.target.value;
          if (!value || value === '') {
            const newFilters = Object.assign({}, filters);
            delete newFilters.lte;
            setFilters(newFilters);
          } else {
            setFilters({ ...filters, lte: value });
          }
        },
        value: filters && parseFloat(filters.lte),
      }}
    />
  </div>
);

registerComponent('DatatableFilterNumbers', DatatableFilterNumbers);
